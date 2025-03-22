#!/usr/bin/env python
# -*- coding: utf-8 -*-

from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
import datetime
import os
import sqlite3

db = SQLAlchemy()

# 데이터베이스 마이그레이션 함수 추가
def migrate_database(app):
    """기존 데이터베이스가 있을 경우 필드를 추가하는 마이그레이션 함수"""
    with app.app_context():
        # 데이터베이스 파일 경로
        db_path = app.config['SQLALCHEMY_DATABASE_URI'].replace('sqlite:///', '')
        if db_path.startswith('/'):
            db_path = db_path[1:]  # 윈도우에서 경로 수정

        print(f"[INFO] 데이터베이스 경로: {db_path}")
        
        if os.path.exists(db_path):
            print(f"[INFO] 데이터베이스 파일 발견: {db_path}")
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            
            # users 테이블이 존재하는지 확인
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
            if cursor.fetchone():
                print("[INFO] users 테이블 발견, 필드 확인 중...")
                
                # 컬럼 정보 확인
                cursor.execute('PRAGMA table_info(users)')
                columns = [column[1] for column in cursor.fetchall()]
                print(f"[INFO] 현재 컬럼: {columns}")
                
                # is_admin 필드 추가 (없는 경우)
                if 'is_admin' not in columns:
                    print("[INFO] is_admin 필드 추가 중...")
                    cursor.execute('ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT 0')
                    conn.commit()
                    print("[INFO] is_admin 필드 추가 완료")
                
                # account_status 필드 추가 (없는 경우)
                if 'account_status' not in columns:
                    print("[INFO] account_status 필드 추가 중...")
                    cursor.execute("ALTER TABLE users ADD COLUMN account_status VARCHAR(20) DEFAULT 'active'")
                    conn.commit()
                    print("[INFO] account_status 필드 추가 완료")
            
            conn.close()
            print("[INFO] 데이터베이스 마이그레이션 완료")
        else:
            print(f"[INFO] 데이터베이스 파일이 존재하지 않습니다. 새로 생성됩니다: {db_path}")

class User(db.Model, UserMixin):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    
    # 관리자 및 계정 상태 필드 추가
    is_admin = db.Column(db.Boolean, default=False, nullable=False)
    account_status = db.Column(db.String(20), default='pending', nullable=False)  # pending, active, blocked
    
    # 사용자의 템플릿, 파일, 대시보드 데이터 관계 설정
    templates = db.relationship('Template', backref='user', lazy=True, cascade="all, delete-orphan")
    uploads = db.relationship('Upload', backref='user', lazy=True, cascade="all, delete-orphan")
    aggregations = db.relationship('Aggregation', backref='user', lazy=True, cascade="all, delete-orphan")
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'is_admin': self.is_admin,
            'account_status': self.account_status,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
        
    def is_active_account(self):
        """계정이 활성화 상태인지 확인"""
        return self.account_status == 'active'
    
    def approve_account(self):
        """계정 승인"""
        self.account_status = 'active'
        db.session.commit()
        
    def block_account(self):
        """계정 차단"""
        self.account_status = 'blocked'
        db.session.commit()
        
    def activate_account(self):
        """계정 활성화"""
        self.account_status = 'active'
        db.session.commit()

class Template(db.Model):
    __tablename__ = 'templates'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    data = db.Column(db.JSON, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

class Upload(db.Model):
    __tablename__ = 'uploads'
    
    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(100), nullable=False)
    filepath = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

class Aggregation(db.Model):
    __tablename__ = 'aggregations'
    
    id = db.Column(db.Integer, primary_key=True)
    dashboard_name = db.Column(db.String(100), nullable=False)
    date = db.Column(db.Date, nullable=False)
    condition_column = db.Column(db.String(100), nullable=False)
    condition_value = db.Column(db.String(100), nullable=False)
    aggregate_column = db.Column(db.String(100), nullable=False)
    sum_value = db.Column(db.Float, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    def to_dict(self):
        return {
            'id': self.id,
            'dashboard_name': self.dashboard_name,
            'date': self.date.isoformat() if self.date else None,
            'condition_column': self.condition_column,
            'condition_value': self.condition_value,
            'aggregate_column': self.aggregate_column,
            'sum_value': self.sum_value,
            'created_at': self.created_at.isoformat() if self.created_at else None
        } 