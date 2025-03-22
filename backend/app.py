#!/usr/bin/env python
# -*- coding: utf-8 -*-

from flask import Flask, request, jsonify, send_from_directory, send_file
from flask_cors import CORS
import pandas as pd
import os
import json
import numpy as np
from werkzeug.utils import secure_filename
from datetime import datetime, timedelta
import uuid

# 상대 임포트에서 절대 임포트로 변경
try:
    from backend.models import db, User, Template, Upload, Aggregation, migrate_database
    from backend.auth import auth_bp, token_required
except ImportError:
    # 직접 실행하는 경우의 대체 임포트
    from models import db, User, Template, Upload, Aggregation, migrate_database
    from auth import auth_bp, token_required

app = Flask(__name__, static_folder='../frontend/build')

# CORS 설정 - 명시적으로 모든 출처, 헤더, 메소드 허용
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

# 모든 응답에 CORS 헤더 추가
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept')
    response.headers.add('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    # OPTIONS 요청에 대해 빠르게 응답
    if request.method == 'OPTIONS':
        response.status_code = 200
    return response

# 설정
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'instance', 'excel_app.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'your_secret_key'
app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'uploads')
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB 최대 파일 크기
app.config['TEMPLATE_FOLDER'] = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'templates')
app.config['EXPORT_FOLDER'] = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'exports')

# 데이터베이스 초기화
db.init_app(app)

# Blueprint 등록
app.register_blueprint(auth_bp, url_prefix='/api/auth')

UPLOAD_FOLDER = 'uploads'
TEMPLATES_FOLDER = 'templates'
AGGREGATION_FOLDER = 'aggregations'
ALLOWED_EXTENSIONS = {'xlsx', 'xls', 'csv'}

# 필요한 폴더 생성
for folder in [UPLOAD_FOLDER, TEMPLATES_FOLDER, AGGREGATION_FOLDER]:
    if not os.path.exists(folder):
        os.makedirs(folder)

# 폴더 생성 함수
def ensure_dir(directory):
    if not os.path.exists(directory):
        try:
            os.makedirs(directory)
            print(f"[DEBUG] 디렉토리 생성 완료: {directory}")
        except Exception as e:
            print(f"[ERROR] 디렉토리 생성 실패: {directory}, 오류: {str(e)}")
    else:
        print(f"[DEBUG] 디렉토리가 이미 존재함: {directory}")

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# 데이터베이스 생성 및 마이그레이션
@app.before_first_request
def create_tables():
    try:
        print("[INFO] 데이터베이스 초기화 중...")
        db.create_all()
        print("[INFO] 데이터베이스 테이블 생성 완료")
        
        # 데이터베이스 마이그레이션 수행
        migrate_database(app)
    except Exception as e:
        print(f"[ERROR] 데이터베이스 초기화 중 오류 발생: {str(e)}")

@app.before_first_request
def create_default_admin():
    """첫 번째 요청 전에 실행되어 기본 관리자 계정이 없으면 생성"""
    try:
        # 기존 관리자 확인
        admin = User.query.filter_by(is_admin=True).first()
        
        # 관리자가 없으면 기본 관리자 생성
        if not admin:
            print("[INFO] 기본 관리자 계정을 생성합니다...")
            admin = User(
                username="admin",
                email="admin@example.com",
                is_admin=True,
                account_status="active"
            )
            admin.set_password("admin123")  # 기본 비밀번호 설정 (보안을 위해 변경 필요)
            db.session.add(admin)
            db.session.commit()
            print("[INFO] 기본 관리자 계정이 생성되었습니다.")
            print("[INFO] 사용자명: admin, 이메일: admin@example.com, 비밀번호: admin123")
            print("[INFO] 보안을 위해 로그인 후 비밀번호를 변경해주세요.")
        else:
            print("[INFO] 관리자 계정이 이미 존재합니다.")
    except Exception as e:
        print(f"[ERROR] 기본 관리자 계정 생성 중 오류 발생: {str(e)}")
        db.session.rollback()

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(app.static_folder + '/' + path):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

@app.route('/api/upload', methods=['POST'])
@token_required
def upload_file(current_user):
    if 'file' not in request.files:
        return jsonify({'error': '파일이 없습니다'}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'error': '선택된 파일이 없습니다'}), 400
    
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        user_upload_dir = os.path.join(UPLOAD_FOLDER, str(current_user.id))
        ensure_dir(user_upload_dir)
        
        # 고유한 파일 이름 생성
        unique_filename = f"{uuid.uuid4().hex}_{filename}"
        filepath = os.path.join(user_upload_dir, unique_filename)
        file.save(filepath)
        
        # 파일 정보 DB에 저장
        new_upload = Upload(
            filename=filename,
            filepath=filepath,
            user_id=current_user.id
        )
        db.session.add(new_upload)
        db.session.commit()
        
        # 파일 읽기
        try:
            if filename.endswith('.csv'):
                df = pd.read_csv(filepath)
            else:
                df = pd.read_excel(filepath)
            
            # 모든 열을 문자열로 변환 (일관된 비교를 위해)
            for col in df.columns:
                df[col] = df[col].astype(str)
            
            # 데이터를 JSON으로 변환
            data = df.to_json(orient='records', force_ascii=False)
            columns = df.columns.tolist()
            
            return jsonify({
                'success': True,
                'filename': filename,
                'data': json.loads(data),
                'columns': columns
            })
        except Exception as e:
            return jsonify({'error': f'파일 처리 중 오류 발생: {str(e)}'}), 500
    
    return jsonify({'error': '허용되지 않는 파일 형식입니다'}), 400

@app.route('/api/process', methods=['POST'])
@token_required
def process_data(current_user):
    data = request.json
    
    if not data or 'data' not in data or 'operations' not in data:
        return jsonify({'error': '유효하지 않은 요청 데이터'}), 400
    
    try:
        # 데이터프레임 생성
        df = pd.DataFrame(data['data'])
        
        # 모든 열을 문자열로 변환 (일관된 비교를 위해)
        for col in df.columns:
            df[col] = df[col].astype(str)
        
        operations = data['operations']
        print(f"처리할 작업 수: {len(operations)}")
        
        # 로그 정보를 저장할 리스트
        logs = []
        # 집계 결과 저장용 변수
        aggregation_results = []
        
        for idx, operation in enumerate(operations):
            op_type = operation.get('type')
            print(f"작업 {idx+1}: {op_type}")
            
            if op_type == 'replace':
                # 데이터 변환 기능 (특정 데이터를 다른 값으로 변경)
                source_col = operation.get('sourceColumn')
                target_col = operation.get('targetColumn')
                search_value = str(operation.get('searchValue'))
                replace_value = str(operation.get('replaceValue'))
                
                log_msg = f"변환: {source_col} 열에서 '{search_value}'를 찾아 {target_col} 열에서 '{replace_value}'로 변경"
                print(log_msg)
                
                if source_col and target_col and search_value is not None:
                    # 정확한 문자열 비교를 위해 astype(str) 사용
                    mask = df[source_col].astype(str) == search_value
                    affected_rows = mask.sum()
                    df.loc[mask, target_col] = replace_value
                    result_msg = f"변경된 행 수: {affected_rows}"
                    print(result_msg)
                    
                    logs.append({
                        'type': 'replace',
                        'description': log_msg,
                        'result': result_msg,
                        'affectedRows': int(affected_rows),
                        'status': 'success'
                    })
                else:
                    logs.append({
                        'type': 'replace',
                        'description': log_msg,
                        'result': '필수 필드 누락',
                        'affectedRows': 0,
                        'status': 'error'
                    })
            
            elif op_type == 'conditional_replace':
                # 조건부 데이터 변경 기능
                conditions = operation.get('conditions', [])
                target_col = operation.get('targetColumn')
                result_value = str(operation.get('resultValue'))
                
                condition_text = ', '.join([f"{c.get('column')}='{c.get('value')}'" for c in conditions])
                log_msg = f"조건부 변환: {len(conditions)}개 조건({condition_text})이 모두 충족될 때 {target_col} 열을 '{result_value}'로 변경"
                print(log_msg)
                
                if conditions and target_col and result_value is not None:
                    mask = pd.Series(True, index=df.index)
                    condition_results = []
                    
                    for condition in conditions:
                        col = condition.get('column')
                        value = str(condition.get('value'))
                        if col and value is not None:
                            # 정확한 문자열 비교를 위해 astype(str) 사용
                            col_mask = df[col].astype(str) == value
                            mask = mask & col_mask
                            condition_result = f"조건: {col} == '{value}', 조건 충족 행 수: {col_mask.sum()}"
                            print(condition_result)
                            condition_results.append(condition_result)
                    
                    affected_rows = mask.sum()
                    df.loc[mask, target_col] = result_value
                    result_msg = f"모든 조건 충족 및 변경된 행 수: {affected_rows}"
                    print(result_msg)
                    
                    logs.append({
                        'type': 'conditional_replace',
                        'description': log_msg,
                        'conditions': condition_results,
                        'result': result_msg,
                        'affectedRows': int(affected_rows),
                        'status': 'success'
                    })
                else:
                    logs.append({
                        'type': 'conditional_replace',
                        'description': log_msg,
                        'result': '필수 필드 누락',
                        'affectedRows': 0,
                        'status': 'error'
                    })
            
            elif op_type == 'conditional_aggregate':
                # 조건부 집계 기능
                condition_col = operation.get('conditionColumn')
                condition_value = str(operation.get('conditionValue'))
                aggregate_col = operation.get('aggregateColumn')
                result_col = operation.get('resultColumn')
                save_to_dashboard = operation.get('saveToDashboard', False)  # 대시보드 저장 옵션
                dashboard_name = operation.get('dashboardName', '기본 대시보드')  # 대시보드 이름
                
                log_msg = f"조건부 집계: {condition_col} 열이 '{condition_value}'인 행의 {aggregate_col} 열 합계"
                print(log_msg)
                
                if condition_col and condition_value is not None and aggregate_col:
                    # 정확한 문자열 비교를 위해 astype(str) 사용
                    mask = df[condition_col].astype(str) == condition_value
                    affected_rows = mask.sum()
                    
                    try:
                        # 숫자로 변환하여 합계 계산
                        numeric_values = pd.to_numeric(df.loc[mask, aggregate_col], errors='coerce')
                        sum_value = numeric_values.sum()
                        result_msg = f"조건 충족 행 수: {affected_rows}, 합계: {sum_value}"
                        print(result_msg)
                        
                        # 새 열에 결과 저장 또는 반환
                        if result_col:
                            df[result_col] = str(sum_value)
                        
                        # 대시보드에 저장하기 위한 정보 추가
                        agg_result = {
                            'type': 'conditional_aggregate',
                            'description': log_msg,
                            'result': result_msg,
                            'affectedRows': int(affected_rows),
                            'sumValue': float(sum_value),
                            'status': 'success',
                            'conditionColumn': condition_col,
                            'conditionValue': condition_value,
                            'aggregateColumn': aggregate_col,
                            'dashboardName': dashboard_name,
                            'date': datetime.now().strftime('%Y-%m-%d')
                        }
                        
                        logs.append(agg_result)
                        
                        # 집계 결과를 대시보드용으로 저장
                        if save_to_dashboard:
                            aggregation_results.append(agg_result)
                    except Exception as agg_error:
                        error_msg = f"집계 중 오류: {str(agg_error)}"
                        print(error_msg)
                        logs.append({
                            'type': 'conditional_aggregate',
                            'description': log_msg,
                            'result': error_msg,
                            'affectedRows': int(affected_rows),
                            'status': 'error'
                        })
                else:
                    logs.append({
                        'type': 'conditional_aggregate',
                        'description': log_msg,
                        'result': '필수 필드 누락',
                        'affectedRows': 0,
                        'status': 'error'
                    })
            
            elif op_type == 'conditional_text_append':
                # 조건부 텍스트 추가 기능
                condition_col = operation.get('conditionColumn')  # 조건 열 (B열)
                condition_val = str(operation.get('conditionValue'))  # 조건 값 (1)
                source_col = operation.get('sourceColumn')  # 소스 열 (A열)
                append_text = str(operation.get('appendText'))  # 추가할 텍스트 (★)
                target_col = operation.get('targetColumn')  # 대상 열 (D열)
                
                log_msg = f"조건부 텍스트 추가: {condition_col} 열이 '{condition_val}'인 행의 {source_col} 열 값에 '{append_text}'를 추가하여 {target_col} 열에 저장"
                print(log_msg)
                
                if condition_col and condition_val is not None and source_col and append_text is not None and target_col:
                    # 정확한 문자열 비교를 위해 astype(str) 사용
                    mask = df[condition_col].astype(str) == condition_val
                    affected_rows = mask.sum()
                    
                    # 모든 행에 대해 먼저 소스 열 값을 복사
                    df[target_col] = df[source_col]
                    
                    # 조건을 만족하는 행에만 텍스트 추가
                    df.loc[mask, target_col] = df.loc[mask, source_col] + append_text
                    
                    result_msg = f"텍스트가 추가된 행 수: {affected_rows}"
                    print(result_msg)
                    
                    logs.append({
                        'type': 'conditional_text_append',
                        'description': log_msg,
                        'result': result_msg,
                        'affectedRows': int(affected_rows),
                        'status': 'success'
                    })
                else:
                    logs.append({
                        'type': 'conditional_text_append',
                        'description': log_msg,
                        'result': '필수 필드 누락',
                        'affectedRows': 0,
                        'status': 'error'
                    })
        
        # 결과 데이터를 JSON으로 변환
        result_data = df.to_json(orient='records', force_ascii=False)
        
        # 성공 여부 판단 (모든 작업이 성공했는지)
        all_success = all(log['status'] == 'success' for log in logs)
        
        # 집계 결과가 있으면 파일에 저장
        if aggregation_results:
            save_aggregation_results(aggregation_results)
        
        return jsonify({
            'success': True,
            'data': json.loads(result_data),
            'columns': df.columns.tolist(),
            'logs': logs,
            'allSuccess': all_success,
            'totalAffectedRows': sum(log.get('affectedRows', 0) for log in logs)
        })
    
    except Exception as e:
        print(f"데이터 처리 중 오류: {str(e)}")
        return jsonify({
            'error': f'데이터 처리 중 오류 발생: {str(e)}',
            'logs': logs if 'logs' in locals() else []
        }), 500

# 집계 결과 저장 함수
def save_aggregation_results(results):
    today = datetime.now().strftime('%Y-%m-%d')
    file_path = os.path.join(AGGREGATION_FOLDER, f"{today}.json")
    
    # 기존 파일이 있으면 불러오기
    existing_data = []
    if os.path.exists(file_path):
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                existing_data = json.load(f)
        except:
            pass
    
    # 새 데이터 추가
    existing_data.extend(results)
    
    # 파일에 저장
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(existing_data, f, ensure_ascii=False, indent=2)
    
    print(f"{len(results)}개의 집계 결과가 {file_path}에 저장되었습니다.")

@app.route('/api/dashboard/aggregations', methods=['GET'])
@token_required
def get_aggregations(current_user):
    """대시보드용 집계 결과를 기간별로 조회하는 API"""
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    dashboard_name = request.args.get('dashboard_name', '기본 대시보드')
    
    try:
        # 날짜 파싱
        if start_date:
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
        else:
            # 기본값: 30일 전
            start_date = (datetime.now() - timedelta(days=30)).date()
            
        if end_date:
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
        else:
            # 기본값: 오늘
            end_date = datetime.now().date()
        
        # 쿼리 구성
        query = Aggregation.query.filter(
            Aggregation.user_id == current_user.id,
            Aggregation.date >= start_date,
            Aggregation.date <= end_date
        )
        
        # 특정 대시보드 이름으로 필터링
        if dashboard_name != '모든 대시보드':
            query = query.filter(Aggregation.dashboard_name == dashboard_name)
            
        aggregations = query.all()
        
        # 날짜 범위 생성
        date_range = []
        current_date = start_date
        while current_date <= end_date:
            date_range.append(current_date.strftime('%Y-%m-%d'))
            current_date += timedelta(days=1)
        
        # 결과 그룹화
        grouped_results = {}
        for agg in aggregations:
            date = agg.date.strftime('%Y-%m-%d')
            condition = f"{agg.condition_column}={agg.condition_value}"
            aggregate = agg.aggregate_column
            
            key = f"{condition} 의 {aggregate} 합계"
            
            if key not in grouped_results:
                grouped_results[key] = {}
                
            grouped_results[key][date] = agg.sum_value
        
        # 시각화용 데이터 형식으로 변환
        chart_data = {
            'labels': sorted(date_range),
            'datasets': []
        }
        
        for key, values in grouped_results.items():
            dataset = {
                'label': key,
                'data': [values.get(date, 0) for date in sorted(date_range)]
            }
            chart_data['datasets'].append(dataset)
        
        return jsonify({
            'success': True,
            'data': chart_data,
            'totalCount': len(aggregations),
            'dashboardName': dashboard_name
        })
    
    except Exception as e:
        print(f"집계 결과 조회 중 오류: {str(e)}")
        return jsonify({'error': f'집계 결과 조회 중 오류 발생: {str(e)}'}), 500

@app.route('/api/dashboard/names', methods=['GET'])
@token_required
def get_dashboard_names(current_user):
    """사용 가능한 대시보드 이름 목록을 반환하는 API"""
    try:
        # 기본 대시보드 이름 설정
        dashboard_names = set(['기본 대시보드', '모든 대시보드'])
        
        # 사용자의 집계 데이터에서 대시보드 이름 추출
        aggregations = Aggregation.query.filter_by(user_id=current_user.id).distinct(Aggregation.dashboard_name).all()
        for agg in aggregations:
            dashboard_names.add(agg.dashboard_name)
        
        return jsonify({
            'success': True,
            'dashboardNames': sorted(list(dashboard_names))
        })
    except Exception as e:
        print(f"대시보드 이름 조회 중 오류: {str(e)}")
        return jsonify({'error': f'대시보드 이름 조회 중 오류 발생: {str(e)}'}), 500

@app.route('/api/export', methods=['POST'])
@token_required
def export_file(current_user):
    data = request.json
    
    if not data or 'data' not in data:
        return jsonify({'error': '내보낼 데이터가 없습니다'}), 400
    
    try:
        # 디버그 정보
        print(f"[DEBUG] 파일 내보내기 요청: user_id={current_user.id}")
        
        # 컬럼 순서 유지를 위해 columns 정보 확인
        original_columns = data.get('columns', [])
        
        # 데이터프레임 생성
        df = pd.DataFrame(data['data'])
        print(f"[DEBUG] 데이터프레임 생성 완료: {len(df)}개 행")
        
        # 원본 컬럼 순서가 제공된 경우 해당 순서대로 정렬
        if original_columns and all(col in df.columns for col in original_columns):
            print(f"[DEBUG] 원본 컬럼 순서대로 정렬: {original_columns}")
            df = df[original_columns]
        else:
            print(f"[DEBUG] 원본 컬럼 순서 정보 없음 또는 불일치. 현재 컬럼: {df.columns.tolist()}")
        
        # 사용자별 내보내기 디렉토리 생성
        script_dir = os.path.dirname(os.path.abspath(__file__))
        export_base_dir = os.path.join(script_dir, 'exports')
        ensure_dir(export_base_dir)
        
        user_export_dir = os.path.join(export_base_dir, str(current_user.id))
        ensure_dir(user_export_dir)
        
        print(f"[DEBUG] 내보내기 디렉토리(절대경로): {os.path.abspath(user_export_dir)}")
        print(f"[DEBUG] 내보내기 디렉토리 존재 여부: {os.path.exists(user_export_dir)}")
        
        # 파일명 생성
        filename = data.get('filename', 'export.xlsx')
        if not filename.endswith('.xlsx'):
            filename += '.xlsx'
            
        # 경로 생성 및 저장
        filepath = os.path.join(user_export_dir, filename)
        print(f"[DEBUG] 전체 파일 경로: {filepath}")
        
        # 엑셀 파일 저장
        df.to_excel(filepath, index=False)
        print(f"[DEBUG] 파일 저장 완료: {filepath}")
        print(f"[DEBUG] 파일 존재 여부: {os.path.exists(filepath)}")
        
        # 다운로드 URL 생성
        download_url = f'/api/download/{current_user.id}/{filename}'
        print(f"[DEBUG] 다운로드 URL: {download_url}")
        
        return jsonify({
            'success': True,
            'filename': filename,
            'download_url': download_url,
            'message': '파일 내보내기가 완료되었습니다'
        })
    except Exception as e:
        print(f"[ERROR] 파일 내보내기 중 오류 발생: {str(e)}")
        return jsonify({'error': f'파일 내보내기 중 오류 발생: {str(e)}'}), 500

@app.route('/api/download/<user_id>/<filename>', methods=['GET'])
@token_required
def download_file(current_user, user_id, filename):
    # 사용자 ID 검증
    if str(current_user.id) != str(user_id):
        print(f"권한 오류: current_user.id={current_user.id}, user_id={user_id}")
        return jsonify({'error': '권한이 없습니다'}), 403
    
    # 파일 경로 구성 (절대 경로 사용)
    script_dir = os.path.dirname(os.path.abspath(__file__))
    export_base_dir = os.path.join(script_dir, 'exports')
    user_export_dir = os.path.join(export_base_dir, str(user_id))
    file_path = os.path.join(user_export_dir, filename)
    
    # 디버그 정보 출력
    print(f"[DEBUG] 파일 다운로드 요청: user_id={user_id}, filename={filename}")
    print(f"[DEBUG] 스크립트 디렉토리: {script_dir}")
    print(f"[DEBUG] 내보내기 기본 디렉토리: {export_base_dir}")
    print(f"[DEBUG] 사용자 디렉토리 경로: {user_export_dir}")
    print(f"[DEBUG] 전체 파일 경로: {file_path}")
    print(f"[DEBUG] 파일 존재 여부: {os.path.exists(file_path)}")
    print(f"[DEBUG] 디렉토리 존재 여부: {os.path.exists(user_export_dir)}")
    
    if not os.path.exists(user_export_dir):
        print(f"[ERROR] 사용자 디렉토리가 존재하지 않음: {user_export_dir}")
        ensure_dir(user_export_dir)
        return jsonify({'error': '사용자 디렉토리가 존재하지 않습니다'}), 404
    
    if not os.path.exists(file_path):
        print(f"[ERROR] 파일이 존재하지 않음: {file_path}")
        return jsonify({'error': '요청한 파일이 존재하지 않습니다'}), 404
    
    try:
        # 파일 전송 (디렉토리와 파일명을 분리하여 호출)
        return send_from_directory(directory=user_export_dir, path=filename, as_attachment=True)
    except Exception as e:
        print(f"[ERROR] 파일 다운로드 중 오류 발생: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'파일 다운로드 중 오류 발생: {str(e)}'}), 500

@app.route('/api/unique-values', methods=['POST'])
def get_unique_values():
    """특정 열의 고유값 목록을 반환하는 엔드포인트"""
    data = request.json
    
    if not data or 'data' not in data or 'column' not in data:
        return jsonify({'error': '유효하지 않은 요청 데이터'}), 400
    
    try:
        # 데이터프레임 생성
        df = pd.DataFrame(data['data'])
        column = data['column']
        
        if column not in df.columns:
            return jsonify({'error': f'열 "{column}"이 데이터에 존재하지 않습니다'}), 400
        
        # 해당 열의 고유값 가져오기 (문자열로 변환)
        unique_values = df[column].astype(str).unique().tolist()
        
        # 값을 정렬 (빈 문자열은 마지막에 배치)
        unique_values.sort(key=lambda x: (x == '', x))
        
        return jsonify({
            'success': True,
            'column': column,
            'uniqueValues': unique_values,
            'count': len(unique_values)
        })
    
    except Exception as e:
        print(f"고유값 조회 중 오류: {str(e)}")
        return jsonify({'error': f'고유값 조회 중 오류 발생: {str(e)}'}), 500

@app.route('/api/templates', methods=['GET'])
@token_required
def get_templates(current_user):
    try:
        templates = Template.query.filter_by(user_id=current_user.id).all()
        template_list = []
        
        for template in templates:
            template_list.append({
                'id': template.id,
                'name': template.name,
                'operations': template.data
            })
        
        return jsonify({'templates': template_list})
    except Exception as e:
        return jsonify({'error': f'템플릿 조회 중 오류 발생: {str(e)}'}), 500

@app.route('/api/templates', methods=['POST'])
@token_required
def save_template(current_user):
    data = request.json
    
    if not data or 'name' not in data or 'operations' not in data:
        return jsonify({'error': '유효하지 않은 템플릿 데이터'}), 400
    
    try:
        # 기존 템플릿 확인
        existing_template = Template.query.filter_by(
            user_id=current_user.id,
            name=data['name']
        ).first()
        
        if existing_template:
            # 기존 템플릿 업데이트
            existing_template.data = data['operations']
            db.session.commit()
            template_id = existing_template.id
        else:
            # 새 템플릿 생성
            new_template = Template(
                name=data['name'],
                data=data['operations'],
                user_id=current_user.id
            )
            db.session.add(new_template)
            db.session.commit()
            template_id = new_template.id
        
        return jsonify({
            'success': True,
            'id': template_id,
            'message': '템플릿이 성공적으로 저장되었습니다'
        })
    
    except Exception as e:
        return jsonify({'error': f'템플릿 저장 중 오류 발생: {str(e)}'}), 500

@app.route('/api/templates/<template_id>', methods=['DELETE'])
@token_required
def delete_template(current_user, template_id):
    try:
        template = Template.query.filter_by(id=template_id, user_id=current_user.id).first()
        
        if not template:
            return jsonify({'error': '해당 템플릿이 존재하지 않거나 권한이 없습니다'}), 404
        
        db.session.delete(template)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': '템플릿이 성공적으로 삭제되었습니다'
        })
    except Exception as e:
        return jsonify({'error': f'템플릿 삭제 중 오류 발생: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(debug=True) 