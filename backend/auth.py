#!/usr/bin/env python
# -*- coding: utf-8 -*-

from flask import Blueprint, request, jsonify, current_app
from flask_login import login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
from datetime import datetime, timedelta
from functools import wraps

# 상대 임포트에서 절대 임포트로 변경
try:
    from backend.models import db, User
except ImportError:
    from models import db, User

auth_bp = Blueprint('auth', __name__)

# JWT 인증 데코레이터
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # 헤더에서 토큰 가져오기
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]
        
        if not token:
            return jsonify({'message': '토큰이 필요합니다'}), 401
        
        try:
            # 토큰 디코딩
            data = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user = User.query.filter_by(id=data['user_id']).first()
            if not current_user:
                return jsonify({'message': '유효하지 않은 토큰입니다'}), 401
        except:
            return jsonify({'message': '유효하지 않은 토큰입니다'}), 401
            
        return f(current_user, *args, **kwargs)
    
    return decorated

# 관리자 권한 확인 데코레이터
def admin_required(f):
    @wraps(f)
    def decorated_function(current_user, *args, **kwargs):
        if not current_user.is_admin:
            return jsonify({'message': '관리자 권한이 필요합니다'}), 403
        return f(current_user, *args, **kwargs)
    return decorated_function

# 회원가입 API
@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.json
    
    if not data or not data.get('username') or not data.get('email') or not data.get('password'):
        return jsonify({'message': '필수 정보가 누락되었습니다'}), 400
    
    try:
        # 이메일 중복 확인 (쿼리에서 추가 열 제외)
        user_check = db.session.query(User.id).filter_by(email=data['email']).first()
        if user_check:
            return jsonify({'message': '이미 등록된 이메일입니다'}), 400
        
        # 사용자명 중복 확인 (쿼리에서 추가 열 제외)
        username_check = db.session.query(User.id).filter_by(username=data['username']).first()
        if username_check:
            return jsonify({'message': '이미 사용 중인 사용자명입니다'}), 400
        
        # 새 사용자 생성
        new_user = User(
            username=data['username'],
            email=data['email'],
            account_status='pending'  # 기본 상태: 승인 대기 중
        )
        new_user.set_password(data['password'])
        
        # DB에 저장
        db.session.add(new_user)
        db.session.commit()
        
        return jsonify({
            'message': '회원가입이 완료되었습니다. 관리자 승인 후 로그인이 가능합니다.',
            'user': {
                'id': new_user.id,
                'username': new_user.username,
                'email': new_user.email
            }
        }), 201
    except Exception as e:
        print(f"회원가입 처리 중 오류 발생: {str(e)}")
        db.session.rollback()
        return jsonify({'message': f'회원가입 처리 중 오류가 발생했습니다: {str(e)}'}), 500

# 로그인 API
@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'message': '이메일과 비밀번호를 입력해주세요'}), 400
    
    try:
        # 사용자 찾기 - SELECT문에서 is_admin과 account_status 필드를 제외
        user = db.session.query(
            User.id, User.username, User.email, User.password_hash, User.created_at
        ).filter_by(email=data['email']).first()
        
        if not user:
            return jsonify({'message': '이메일 또는 비밀번호가 일치하지 않습니다'}), 401
        
        # 비밀번호 확인
        user_obj = User.query.get(user.id)
        if not user_obj.check_password(data['password']):
            return jsonify({'message': '이메일 또는 비밀번호가 일치하지 않습니다'}), 401
        
        # 계정 상태 확인 - 필드가 있는 경우에만
        try:
            if hasattr(user_obj, 'account_status'):
                if user_obj.account_status == 'pending':
                    return jsonify({'message': '계정 승인 대기 중입니다. 관리자의 승인이 필요합니다.'}), 403
                elif user_obj.account_status == 'blocked':
                    return jsonify({'message': '계정이 차단되었습니다. 관리자에게 문의하세요.'}), 403
        except Exception as e:
            print(f"계정 상태 확인 중 오류: {str(e)}")
            # 오류가 발생하더라도 로그인은 계속 진행
        
        # JWT 토큰 생성
        token_data = {
            'user_id': user.id,
            'exp': datetime.utcnow() + timedelta(days=1)  # 토큰 유효기간: 1일
        }
        
        # 관리자 여부 확인 (필드가 있는 경우에만)
        try:
            if hasattr(user_obj, 'is_admin') and user_obj.is_admin:
                token_data['is_admin'] = True
        except Exception as e:
            print(f"관리자 확인 중 오류: {str(e)}")
            # 오류가 발생하더라도 로그인은 계속 진행
        
        token = jwt.encode(token_data, current_app.config['SECRET_KEY'], algorithm="HS256")
        
        # 사용자 정보를 사전으로 변환
        user_dict = {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'created_at': user.created_at.isoformat() if user.created_at else None
        }
        
        # 추가 필드가 있는 경우 사전에 추가
        try:
            if hasattr(user_obj, 'is_admin'):
                user_dict['is_admin'] = user_obj.is_admin
            if hasattr(user_obj, 'account_status'):
                user_dict['account_status'] = user_obj.account_status
        except Exception as e:
            print(f"사용자 정보 변환 중 오류: {str(e)}")
        
        return jsonify({
            'token': token,
            'user': user_dict,
            'message': '로그인되었습니다'
        }), 200
    except Exception as e:
        print(f"로그인 중 오류 발생: {str(e)}")
        return jsonify({'message': f'로그인 처리 중 오류가 발생했습니다: {str(e)}'}), 500

# 현재 사용자 정보 API
@auth_bp.route('/me', methods=['GET'])
@token_required
def get_me(current_user):
    return jsonify({
        'user': current_user.to_dict(),
        'message': '사용자 정보를 성공적으로 가져왔습니다'
    }), 200

# 비밀번호 변경 API
@auth_bp.route('/change-password', methods=['POST'])
@token_required
def change_password(current_user):
    data = request.json
    
    if not data or not data.get('current_password') or not data.get('new_password'):
        return jsonify({'message': '현재 비밀번호와 새 비밀번호를 입력해주세요'}), 400
    
    if not current_user.check_password(data['current_password']):
        return jsonify({'message': '현재 비밀번호가 일치하지 않습니다'}), 401
    
    current_user.set_password(data['new_password'])
    db.session.commit()
    
    return jsonify({'message': '비밀번호가 성공적으로 변경되었습니다'}), 200

# 모든 사용자 목록 가져오기 (관리자용)
@auth_bp.route('/admin/users', methods=['GET'])
@token_required
@admin_required
def get_all_users(current_user):
    users = User.query.all()
    return jsonify({
        'users': [user.to_dict() for user in users],
        'message': '사용자 목록을 성공적으로 가져왔습니다'
    }), 200

# 사용자 승인 (관리자용)
@auth_bp.route('/admin/users/<int:user_id>/approve', methods=['POST'])
@token_required
@admin_required
def approve_user(current_user, user_id):
    user = User.query.get_or_404(user_id)
    
    if user.account_status == 'active':
        return jsonify({'message': '이미 승인된 계정입니다'}), 400
    
    user.approve_account()
    
    return jsonify({
        'message': f'사용자 {user.username}의 계정이 승인되었습니다',
        'user': user.to_dict()
    }), 200

# 사용자 차단 (관리자용)
@auth_bp.route('/admin/users/<int:user_id>/block', methods=['POST'])
@token_required
@admin_required
def block_user(current_user, user_id):
    user = User.query.get_or_404(user_id)
    
    if user.id == current_user.id:
        return jsonify({'message': '자신의 계정은 차단할 수 없습니다'}), 400
    
    user.block_account()
    
    return jsonify({
        'message': f'사용자 {user.username}의 계정이 차단되었습니다',
        'user': user.to_dict()
    }), 200

# 사용자 활성화 (관리자용)
@auth_bp.route('/admin/users/<int:user_id>/activate', methods=['POST'])
@token_required
@admin_required
def activate_user(current_user, user_id):
    user = User.query.get_or_404(user_id)
    
    if user.account_status == 'active':
        return jsonify({'message': '이미 활성화된 계정입니다'}), 400
    
    user.activate_account()
    
    return jsonify({
        'message': f'사용자 {user.username}의 계정이 활성화되었습니다',
        'user': user.to_dict()
    }), 200

# 관리자 권한 부여 (최고 관리자용)
@auth_bp.route('/admin/users/<int:user_id>/set-admin', methods=['POST'])
@token_required
@admin_required
def set_admin_privileges(current_user, user_id):
    user = User.query.get_or_404(user_id)
    data = request.json
    
    if not data or 'is_admin' not in data:
        return jsonify({'message': '관리자 권한 설정 값이 필요합니다'}), 400
    
    # 관리자 권한 설정
    user.is_admin = data['is_admin']
    db.session.commit()
    
    action = '부여' if user.is_admin else '해제'
    return jsonify({
        'message': f'사용자 {user.username}의 관리자 권한이 {action}되었습니다',
        'user': user.to_dict()
    }), 200 