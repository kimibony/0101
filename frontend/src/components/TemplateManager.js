import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Alert,
  CircularProgress
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import axios from 'axios';

function TemplateManager({ operations, onApplyTemplate }) {
  const [templateName, setTemplateName] = useState('');
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState(null);

  // 템플릿 목록 불러오기
  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await axios.get('/api/templates');
      setTemplates(response.data.templates || []);
    } catch (error) {
      console.error('템플릿 불러오기 오류:', error);
      setError('템플릿을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 템플릿 목록 불러오기
  useEffect(() => {
    fetchTemplates();
  }, []);

  // 템플릿 저장 핸들러
  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      setError('템플릿 이름을 입력하세요.');
      return;
    }

    if (!operations || operations.length === 0) {
      setError('저장할 작업이 없습니다. 작업을 먼저 추가하세요.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const response = await axios.post('/api/templates', {
        name: templateName,
        operations: operations
      });

      if (response.data.success) {
        setSuccess('템플릿이 성공적으로 저장되었습니다.');
        setTemplateName('');
        fetchTemplates();
      }
    } catch (error) {
      console.error('템플릿 저장 오류:', error);
      setError('템플릿 저장 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 템플릿 세부정보 보기 핸들러
  const handleViewTemplate = (template) => {
    setSelectedTemplate(template);
    setOpenDialog(true);
  };

  // 템플릿 적용 핸들러
  const handleApplyTemplate = () => {
    if (selectedTemplate && selectedTemplate.operations) {
      onApplyTemplate(selectedTemplate.operations);
      setOpenDialog(false);
      setSuccess(`'${selectedTemplate.name}' 템플릿이 적용되었습니다.`);
    }
  };

  // 템플릿 세부정보 다이얼로그 닫기 핸들러
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  // 템플릿 삭제 다이얼로그 열기 핸들러
  const handleOpenDeleteDialog = (template, event) => {
    event.stopPropagation();
    setTemplateToDelete(template);
    setDeleteDialogOpen(true);
  };

  // 템플릿 삭제 다이얼로그 닫기 핸들러
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setTemplateToDelete(null);
  };

  // 템플릿 삭제 핸들러
  const handleDeleteTemplate = async () => {
    if (!templateToDelete) return;
    
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      // 디버깅: 템플릿 ID 확인
      console.log("삭제할 템플릿 ID:", templateToDelete.id);
      
      if (!templateToDelete.id) {
        setError('템플릿 ID가 유효하지 않습니다.');
        setLoading(false);
        return;
      }
      
      const response = await axios.delete(`/api/templates/${templateToDelete.id}`);
      
      if (response.data.success) {
        setSuccess(`'${templateToDelete.name}' 템플릿이 삭제되었습니다.`);
        fetchTemplates();
      }
    } catch (error) {
      console.error('템플릿 삭제 오류:', error);
      setError('템플릿 삭제 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
      setTemplateToDelete(null);
    }
  };

  // 작업 유형 텍스트 가져오기
  const getOperationTypeText = (type) => {
    switch (type) {
      case 'replace':
        return '데이터 변환';
      case 'conditional_replace':
        return '조건부 변환';
      case 'conditional_aggregate':
        return '조건부 집계';
      default:
        return '알 수 없음';
    }
  };

  // 작업 설명 가져오기
  const getOperationDescription = (operation) => {
    if (operation.type === 'replace') {
      return `${operation.sourceColumn} 열의 '${operation.searchValue}'를 ${operation.targetColumn} 열에서 '${operation.replaceValue}'로 변환`;
    } else if (operation.type === 'conditional_replace') {
      const conditions = operation.conditions?.map(c => `${c.column}='${c.value}'`).join(' 그리고 ') || '';
      return `조건 (${conditions})일 때 ${operation.targetColumn} 열을 '${operation.resultValue}'로 설정`;
    } else if (operation.type === 'conditional_aggregate') {
      return `${operation.conditionColumn} 열이 '${operation.conditionValue}'일 때 ${operation.aggregateColumn} 열 값 합산`;
    }
    return '';
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        템플릿 관리
      </Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          현재 작업 저장
        </Typography>
        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            size="small"
            label="템플릿 이름"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handleSaveTemplate}
            disabled={loading || !templateName.trim() || operations.length === 0}
            startIcon={<SaveIcon />}
          >
            {loading ? <CircularProgress size={24} /> : '템플릿으로 저장'}
          </Button>
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
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          저장된 템플릿
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <CircularProgress size={24} />
          </Box>
        ) : templates.length === 0 ? (
          <Alert severity="info">
            저장된 템플릿이 없습니다. 작업을 구성한 후 템플릿으로 저장하세요.
          </Alert>
        ) : (
          <List>
            {templates.map((template, index) => (
              <React.Fragment key={template.id}>
                {index > 0 && <Divider />}
                <ListItem>
                  <ListItemText
                    primary={template.name}
                    secondary={`작업 ${template.operations?.length || 0}개`}
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={() => handleViewTemplate(template)}
                      color="primary"
                      sx={{ mr: 1 }}
                    >
                      <FolderOpenIcon />
                    </IconButton>
                    <IconButton
                      edge="end"
                      onClick={(event) => handleOpenDeleteDialog(template, event)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>

      {/* 템플릿 세부정보 다이얼로그 */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          템플릿: {selectedTemplate?.name}
        </DialogTitle>
        <DialogContent dividers>
          {selectedTemplate?.operations?.length > 0 ? (
            <List>
              {selectedTemplate.operations.map((operation, index) => (
                <ListItem key={index}>
                  <ListItemText
                    primary={getOperationTypeText(operation.type)}
                    secondary={getOperationDescription(operation)}
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography color="text.secondary">
              이 템플릿에는 작업이 없습니다.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="inherit">
            취소
          </Button>
          <Button
            onClick={handleApplyTemplate}
            color="primary"
            variant="contained"
            disabled={!selectedTemplate?.operations?.length}
          >
            이 템플릿 적용
          </Button>
        </DialogActions>
      </Dialog>

      {/* 템플릿 삭제 확인 다이얼로그 */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
      >
        <DialogTitle>템플릿 삭제</DialogTitle>
        <DialogContent>
          <Typography>
            '{templateToDelete?.name}' 템플릿을 삭제하시겠습니까?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            이 작업은 되돌릴 수 없습니다.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} color="inherit">
            취소
          </Button>
          <Button onClick={handleDeleteTemplate} color="error" variant="contained">
            삭제
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default TemplateManager; 