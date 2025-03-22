import React, { useState, useCallback } from 'react';
import { Box, Paper, Typography, Button, CircularProgress, Alert } from '@mui/material';
import { styled } from '@mui/material/styles';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';

// 스타일 컴포넌트
const DropzoneBox = styled(Paper, {
  shouldForwardProp: (prop) => prop !== 'isDragActive'
})(({ theme, isDragActive }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: theme.spacing(4),
  borderWidth: 2,
  borderRadius: theme.shape.borderRadius,
  borderColor: isDragActive ? theme.palette.primary.main : theme.palette.divider,
  borderStyle: 'dashed',
  backgroundColor: isDragActive ? theme.palette.action.hover : theme.palette.background.paper,
  color: theme.palette.text.primary,
  outline: 'none',
  transition: 'border .24s ease-in-out',
  cursor: 'pointer',
  '&:hover': {
    borderColor: theme.palette.primary.main,
  },
}));

function FileUpload({ onFileUpload }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const onDrop = useCallback(async (acceptedFiles) => {
    // 파일 유효성 검사
    if (acceptedFiles.length === 0) {
      setError('유효한 파일을 선택해주세요');
      return;
    }

    const file = acceptedFiles[0];
    const fileExtension = file.name.split('.').pop().toLowerCase();

    if (!['xlsx', 'xls', 'csv'].includes(fileExtension)) {
      setError('엑셀 또는 CSV 파일만 업로드 가능합니다');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      setSuccess('');

      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('백엔드 응답:', response);
      console.log('응답 데이터 구조:', JSON.stringify(response.data, null, 2));
      
      // 데이터 구조 분석
      const responseData = response.data;
      console.log('응답 데이터 타입:', typeof responseData);
      console.log('응답 데이터 키:', Object.keys(responseData));
      
      console.log('데이터 배열 길이:', responseData.data && Array.isArray(responseData.data) ? responseData.data.length : 0);
      console.log('컬럼 정보:', responseData.columns);
      
      // 데이터 분석
      if (responseData.data && responseData.data.length > 0) {
        console.log('첫 번째 데이터 항목:', responseData.data[0]);
        console.log('첫 번째 항목 키:', Object.keys(responseData.data[0]));
      }

      if (responseData.success) {
        setSuccess(`"${file.name}" 파일이 성공적으로 업로드되었습니다`);
        console.log('onFileUpload 호출 전:', responseData);
        
        // onFileUpload 함수를 호출하여 부모 컴포넌트에 데이터 전달
        if (typeof onFileUpload === 'function') {
          onFileUpload(responseData);
        } else {
          console.error('onFileUpload는 함수가 아닙니다:', typeof onFileUpload);
        }
      } else {
        setError(responseData.error || '서버에서 오류 응답을 받았습니다');
      }
    } catch (error) {
      console.error('파일 업로드 중 오류:', error);
      setError(error.response?.data?.error || '파일 업로드 중 오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  }, [onFileUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv'],
    },
    multiple: false,
  });

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          엑셀 파일 업로드
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          엑셀(.xlsx, .xls) 또는 CSV 파일을 드래그 앤 드롭하거나 클릭하여 업로드하세요.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <DropzoneBox {...getRootProps()} isDragActive={isDragActive}>
        <input {...getInputProps()} />
        <CloudUploadIcon color="primary" sx={{ fontSize: 48, mb: 2 }} />
        {isLoading ? (
          <CircularProgress size={24} />
        ) : (
          <>
            <Typography variant="body1" align="center">
              {isDragActive
                ? '여기에 파일을 놓으세요'
                : '파일을 여기에 드래그하거나 클릭하여 선택하세요'}
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Button variant="contained" color="primary">
                파일 선택
              </Button>
            </Box>
          </>
        )}
      </DropzoneBox>
    </Box>
  );
}

export default FileUpload; 