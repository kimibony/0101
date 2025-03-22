import requests
import sys

try:
    response = requests.get('http://localhost:5000')
    print(f"서버 상태: {response.status_code}")
except Exception as e:
    print(f"오류 발생: {str(e)}")
    
try:
    response = requests.get('http://localhost:3000')
    print(f"프론트엔드 서버 상태: {response.status_code}")
except Exception as e:
    print(f"프론트엔드 오류 발생: {str(e)}")
    
# 회원가입 API 테스트
try:
    response = requests.post('http://localhost:5000/api/auth/register', 
                           json={"username": "testuser2", "email": "test2@example.com", "password": "password123"})
    print(f"회원가입 API 상태: {response.status_code}")
    print(f"응답: {response.text}")
except Exception as e:
    print(f"회원가입 API 오류 발생: {str(e)}")
    
# 로그인 API 테스트
try:
    response = requests.post('http://localhost:5000/api/auth/login', 
                           json={"email": "test@example.com", "password": "password123"})
    print(f"로그인 API 상태: {response.status_code}")
    print(f"응답: {response.text}")
except Exception as e:
    print(f"로그인 API 오류 발생: {str(e)}") 