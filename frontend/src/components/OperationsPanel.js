import React, { useState } from 'react';
import {
  Box, 
  Paper, 
  Typography, 
  Accordion, 
  AccordionSummary, 
  AccordionDetails,
  Button, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel,
  TextField,
  IconButton,
  Divider,
  Stack,
  Alert,
  FormHelperText,
  Grid,
  Chip,
  CircularProgress,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import FunctionsIcon from '@mui/icons-material/Functions';
import SaveIcon from '@mui/icons-material/Save';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import EditIcon from '@mui/icons-material/Edit';

function OperationsPanel({ columns, operations, setOperations, onProcessData, onExportFile }) {
  const [expanded, setExpanded] = useState(false);
  const [currentOperation, setCurrentOperation] = useState({
    type: 'replace',
    sourceColumn: '',
    targetColumn: '',
    searchValue: '',
    replaceValue: ''
  });
  const [conditionalOperation, setConditionalOperation] = useState({
    type: 'conditional_replace',
    conditions: [{ column: '', value: '' }],
    targetColumn: '',
    resultValue: ''
  });
  const [aggregateOperation, setAggregateOperation] = useState({
    type: 'conditional_aggregate',
    conditionColumn: '',
    conditionValue: '',
    aggregateColumn: '',
    resultColumn: '',
    saveToDashboard: false,
    dashboardName: '기본 대시보드'
  });
  
  // 조건부 텍스트 추가 작업 상태
  const [textAppendOperation, setTextAppendOperation] = useState({
    type: 'conditional_text_append',
    conditionColumn: '',
    conditionValue: '',
    sourceColumn: '',
    appendText: '',
    targetColumn: ''
  });
  
  // 작업 실행 상태
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  // 편집 모드 상태
  const [editingIndex, setEditingIndex] = useState(-1);

  // 아코디언 확장 핸들러
  const handleExpandChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  // 단순 변환 작업 핸들러
  const handleReplaceChange = (field) => (event) => {
    setCurrentOperation({
      ...currentOperation,
      [field]: event.target.value
    });
  };

  const handleAddReplaceOperation = () => {
    if (editingIndex >= 0) {
      // 편집 모드: 기존 작업 업데이트
      const newOperations = [...operations];
      newOperations[editingIndex] = currentOperation;
      setOperations(newOperations);
      resetForms();
    } else {
      // 추가 모드: 새 작업 추가
      const newOperations = [...operations, currentOperation];
      setOperations(newOperations);
      setCurrentOperation({
        type: 'replace',
        sourceColumn: '',
        targetColumn: '',
        searchValue: '',
        replaceValue: ''
      });
    }
  };

  // 조건부 변환 작업 핸들러
  const handleConditionalChange = (field) => (event) => {
    setConditionalOperation({
      ...conditionalOperation,
      [field]: event.target.value
    });
  };

  const handleConditionChange = (index, field) => (event) => {
    const newConditions = [...conditionalOperation.conditions];
    newConditions[index] = {
      ...newConditions[index],
      [field]: event.target.value
    };
    setConditionalOperation({
      ...conditionalOperation,
      conditions: newConditions
    });
  };

  const handleAddCondition = () => {
    setConditionalOperation({
      ...conditionalOperation,
      conditions: [...conditionalOperation.conditions, { column: '', value: '' }]
    });
  };

  const handleRemoveCondition = (index) => {
    const newConditions = [...conditionalOperation.conditions];
    newConditions.splice(index, 1);
    setConditionalOperation({
      ...conditionalOperation,
      conditions: newConditions
    });
  };

  const handleAddConditionalOperation = () => {
    if (editingIndex >= 0) {
      // 편집 모드: 기존 작업 업데이트
      const newOperations = [...operations];
      newOperations[editingIndex] = conditionalOperation;
      setOperations(newOperations);
      resetForms();
    } else {
      // 추가 모드: 새 작업 추가
      const newOperations = [...operations, conditionalOperation];
      setOperations(newOperations);
      setConditionalOperation({
        type: 'conditional_replace',
        conditions: [{ column: '', value: '' }],
        targetColumn: '',
        resultValue: ''
      });
    }
  };

  // 집계 작업 핸들러
  const handleAggregateChange = (field) => (event) => {
    if (field === 'saveToDashboard') {
      setAggregateOperation({
        ...aggregateOperation,
        [field]: event.target.checked
      });
    } else {
      setAggregateOperation({
        ...aggregateOperation,
        [field]: event.target.value
      });
    }
  };

  const handleAddAggregateOperation = () => {
    if (editingIndex >= 0) {
      // 편집 모드: 기존 작업 업데이트
      const newOperations = [...operations];
      newOperations[editingIndex] = aggregateOperation;
      setOperations(newOperations);
      resetForms();
    } else {
      // 추가 모드: 새 작업 추가
      const newOperations = [...operations, aggregateOperation];
      setOperations(newOperations);
      setAggregateOperation({
        type: 'conditional_aggregate',
        conditionColumn: '',
        conditionValue: '',
        aggregateColumn: '',
        resultColumn: '',
        saveToDashboard: false,
        dashboardName: '기본 대시보드'
      });
    }
  };

  // 조건부 텍스트 추가 작업 핸들러
  const handleTextAppendChange = (field) => (event) => {
    setTextAppendOperation({
      ...textAppendOperation,
      [field]: event.target.value
    });
  };
  
  const handleAddTextAppendOperation = () => {
    if (editingIndex >= 0) {
      // 편집 모드: 기존 작업 업데이트
      const newOperations = [...operations];
      newOperations[editingIndex] = textAppendOperation;
      setOperations(newOperations);
      resetForms();
    } else {
      // 추가 모드: 새 작업 추가
      const newOperations = [...operations, textAppendOperation];
      setOperations(newOperations);
      setTextAppendOperation({
        type: 'conditional_text_append',
        conditionColumn: '',
        conditionValue: '',
        sourceColumn: '',
        appendText: '',
        targetColumn: ''
      });
    }
  };

  // 작업 제거 핸들러
  const handleRemoveOperation = (index) => {
    const newOperations = [...operations];
    newOperations.splice(index, 1);
    setOperations(newOperations);
    
    // 제거하는 작업이 현재 편집 중인 작업이라면 편집 모드 종료
    if (index === editingIndex) {
      resetForms();
    }
  };
  
  // 작업 편집 핸들러
  const handleEditOperation = (index) => {
    const operation = operations[index];
    setEditingIndex(index);
    
    // 작업 유형에 따라 적절한 폼 상태 설정
    if (operation.type === 'replace') {
      setCurrentOperation(operation);
      setExpanded('panel1');
    } else if (operation.type === 'conditional_replace') {
      setConditionalOperation(operation);
      setExpanded('panel2');
    } else if (operation.type === 'conditional_aggregate') {
      setAggregateOperation(operation);
      setExpanded('panel3');
    } else if (operation.type === 'conditional_text_append') {
      setTextAppendOperation(operation);
      setExpanded('panel4');
    }
  };
  
  // 편집 모드 종료 및 폼 초기화
  const resetForms = () => {
    setEditingIndex(-1);
    setCurrentOperation({
      type: 'replace',
      sourceColumn: '',
      targetColumn: '',
      searchValue: '',
      replaceValue: ''
    });
    setConditionalOperation({
      type: 'conditional_replace',
      conditions: [{ column: '', value: '' }],
      targetColumn: '',
      resultValue: ''
    });
    setAggregateOperation({
      type: 'conditional_aggregate',
      conditionColumn: '',
      conditionValue: '',
      aggregateColumn: '',
      resultColumn: '',
      saveToDashboard: false,
      dashboardName: '기본 대시보드'
    });
    setTextAppendOperation({
      type: 'conditional_text_append',
      conditionColumn: '',
      conditionValue: '',
      sourceColumn: '',
      appendText: '',
      targetColumn: ''
    });
  };

  // 작업 유형 얻기
  const getOperationTypeText = (type) => {
    switch (type) {
      case 'replace':
        return '데이터 변환';
      case 'conditional_replace':
        return '조건부 변환';
      case 'conditional_aggregate':
        return '조건부 집계';
      case 'conditional_text_append':
        return '조건부 텍스트 추가';
      default:
        return '알 수 없음';
    }
  };

  // 작업 설명 얻기
  const getOperationDescription = (operation) => {
    if (operation.type === 'replace') {
      return `${operation.sourceColumn} 열에서 '${operation.searchValue}'를 '${operation.replaceValue}'로 변경`;
    } else if (operation.type === 'conditional_replace') {
      const conditionsText = operation.conditions.map(c => `${c.column}='${c.value}'`).join(' 그리고 ');
      return `${conditionsText} 조건 충족 시 ${operation.targetColumn}을(를) '${operation.resultValue}'로 변경`;
    } else if (operation.type === 'conditional_aggregate') {
      return `${operation.conditionColumn} 열이 '${operation.conditionValue}'일 때 ${operation.aggregateColumn} 열 값 합산`;
    } else if (operation.type === 'conditional_text_append') {
      return `${operation.conditionColumn} 열이 '${operation.conditionValue}'일 때 ${operation.sourceColumn} 열 값에 '${operation.appendText}'를 추가하여 ${operation.targetColumn} 열에 저장`;
    }
    return '';
  };

  // 작업 실행 핸들러 (기존 onProcessData 래핑)
  const handleProcessData = async () => {
    if (operations.length === 0) {
      return;
    }
    
    setIsProcessing(true);
    try {
      await onProcessData();
    } finally {
      setIsProcessing(false);
    }
  };
  
  // 내보내기 핸들러 (기존 onExportFile 래핑)
  const handleExportFile = async () => {
    if (operations.length === 0) {
      return;
    }
    
    setIsExporting(true);
    try {
      await onExportFile();
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        데이터 처리 작업
      </Typography>

      {/* 현재 작업 목록 */}
      {operations.length > 0 && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            등록된 작업 ({operations.length})
          </Typography>
          <Stack spacing={1}>
            {operations.map((operation, index) => (
              <Box 
                key={index} 
                sx={{
                  p: 1.5,
                  borderRadius: 1,
                  bgcolor: index === editingIndex ? 'action.selected' : 'background.default',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  border: index === editingIndex ? '1px dashed' : 'none',
                  borderColor: 'primary.main'
                }}
              >
                <Box 
                  sx={{ 
                    flex: 1, 
                    cursor: 'pointer', 
                    '&:hover': { textDecoration: 'underline' }
                  }}
                  onClick={() => handleEditOperation(index)}
                >
                  <Chip 
                    size="small" 
                    label={getOperationTypeText(operation.type)} 
                    color={
                      operation.type === 'replace' 
                        ? 'primary' 
                        : operation.type === 'conditional_replace' 
                          ? 'secondary' 
                          : operation.type === 'conditional_aggregate' 
                            ? 'info'
                            : 'warning'
                    }
                    sx={{ mr: 1 }}
                  />
                  <Typography variant="body2" component="span">
                    {getOperationDescription(operation)}
                  </Typography>
                </Box>
                <Box>
                  <IconButton 
                    size="small" 
                    color="primary" 
                    onClick={() => handleEditOperation(index)}
                    sx={{ mr: 0.5 }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    color="error" 
                    onClick={() => handleRemoveOperation(index)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            ))}
          </Stack>
          <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
            <Button 
              variant="contained" 
              onClick={handleProcessData}
              startIcon={isProcessing ? <CircularProgress size={20} color="inherit" /> : <CompareArrowsIcon />}
              disabled={operations.length === 0 || isProcessing}
              fullWidth
            >
              {isProcessing ? '처리 중...' : '작업 실행'}
            </Button>
            <Button 
              variant="outlined" 
              onClick={handleExportFile}
              startIcon={isExporting ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
              disabled={operations.length === 0 || isExporting}
            >
              {isExporting ? '내보내는 중...' : '결과 내보내기'}
            </Button>
          </Box>
        </Paper>
      )}

      {/* 작업 추가 섹션 */}
      <Paper sx={{ mb: 2 }}>
        {/* 데이터 변환 */}
        <Accordion expanded={expanded === 'panel1'} onChange={handleExpandChange('panel1')}>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel1a-content"
            id="panel1a-header"
          >
            <Typography sx={{ display: 'flex', alignItems: 'center' }}>
              <SwapHorizIcon sx={{ mr: 1 }} />
              데이터 변환 {editingIndex >= 0 && operations[editingIndex]?.type === 'replace' ? '(편집 중)' : ''}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" color="text.secondary" paragraph>
              특정 열의 데이터를 다른 열에서 다른 값으로 변환합니다.
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                  <InputLabel>소스 열 선택</InputLabel>
                  <Select
                    value={currentOperation.sourceColumn}
                    onChange={handleReplaceChange('sourceColumn')}
                    label="소스 열 선택"
                  >
                    {columns.map((column, index) => (
                      <MenuItem key={index} value={column}>{column}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                  <InputLabel>대상 열 선택</InputLabel>
                  <Select
                    value={currentOperation.targetColumn}
                    onChange={handleReplaceChange('targetColumn')}
                    label="대상 열 선택"
                  >
                    {columns.map((column, index) => (
                      <MenuItem key={index} value={column}>{column}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="검색할 값"
                  value={currentOperation.searchValue}
                  onChange={handleReplaceChange('searchValue')}
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="변환할 값"
                  value={currentOperation.replaceValue}
                  onChange={handleReplaceChange('replaceValue')}
                  sx={{ mb: 2 }}
                />
              </Grid>
            </Grid>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleAddReplaceOperation}
                disabled={
                  !currentOperation.sourceColumn ||
                  !currentOperation.targetColumn ||
                  currentOperation.searchValue === ''
                }
                startIcon={editingIndex >= 0 ? <EditIcon /> : <AddIcon />}
              >
                {editingIndex >= 0 && operations[editingIndex]?.type === 'replace' ? '변환 작업 수정' : '변환 작업 추가'}
              </Button>
              
              {editingIndex >= 0 && operations[editingIndex]?.type === 'replace' && (
                <Button
                  variant="outlined"
                  onClick={resetForms}
                >
                  취소
                </Button>
              )}
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* 조건부 변환 */}
        <Accordion expanded={expanded === 'panel2'} onChange={handleExpandChange('panel2')}>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel2a-content"
            id="panel2a-header"
          >
            <Typography sx={{ display: 'flex', alignItems: 'center' }}>
              <CompareArrowsIcon sx={{ mr: 1 }} />
              조건부 변환 {editingIndex >= 0 && operations[editingIndex]?.type === 'conditional_replace' ? '(편집 중)' : ''}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" color="text.secondary" paragraph>
              여러 조건이 모두 만족할 때 특정 열의 값을 변경합니다.
            </Typography>
            
            {/* 조건 목록 */}
            <Typography variant="subtitle2" gutterBottom>조건</Typography>
            {conditionalOperation.conditions.map((condition, index) => (
              <Box key={index} sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <FormControl size="small" sx={{ flex: 1 }}>
                  <InputLabel>열 선택</InputLabel>
                  <Select
                    value={condition.column}
                    onChange={handleConditionChange(index, 'column')}
                    label="열 선택"
                  >
                    {columns.map((column, colIndex) => (
                      <MenuItem key={colIndex} value={column}>{column}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  size="small"
                  label="값"
                  value={condition.value}
                  onChange={handleConditionChange(index, 'value')}
                  sx={{ flex: 1 }}
                />
                <IconButton 
                  color="error" 
                  onClick={() => handleRemoveCondition(index)}
                  disabled={conditionalOperation.conditions.length <= 1}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            ))}
            
            <Button
              size="small"
              startIcon={<AddIcon />}
              onClick={handleAddCondition}
              sx={{ mb: 2 }}
            >
              조건 추가
            </Button>

            <Divider sx={{ my: 2 }} />
            
            {/* 결과 설정 */}
            <Typography variant="subtitle2" gutterBottom>결과</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                  <InputLabel>대상 열 선택</InputLabel>
                  <Select
                    value={conditionalOperation.targetColumn}
                    onChange={handleConditionalChange('targetColumn')}
                    label="대상 열 선택"
                  >
                    {columns.map((column, index) => (
                      <MenuItem key={index} value={column}>{column}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="설정할 값"
                  value={conditionalOperation.resultValue}
                  onChange={handleConditionalChange('resultValue')}
                  sx={{ mb: 2 }}
                />
              </Grid>
            </Grid>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                color="secondary"
                onClick={handleAddConditionalOperation}
                disabled={
                  !conditionalOperation.targetColumn ||
                  conditionalOperation.resultValue === '' ||
                  conditionalOperation.conditions.some(c => !c.column || c.value === '')
                }
                startIcon={editingIndex >= 0 ? <EditIcon /> : <AddIcon />}
              >
                {editingIndex >= 0 && operations[editingIndex]?.type === 'conditional_replace' ? '조건부 변환 수정' : '조건부 변환 추가'}
              </Button>
              
              {editingIndex >= 0 && operations[editingIndex]?.type === 'conditional_replace' && (
                <Button
                  variant="outlined"
                  onClick={resetForms}
                >
                  취소
                </Button>
              )}
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* 조건부 집계 */}
        <Accordion expanded={expanded === 'panel3'} onChange={handleExpandChange('panel3')}>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel3a-content"
            id="panel3a-header"
          >
            <Typography sx={{ display: 'flex', alignItems: 'center' }}>
              <FunctionsIcon sx={{ mr: 1 }} />
              조건부 집계 {editingIndex >= 0 && operations[editingIndex]?.type === 'conditional_aggregate' ? '(편집 중)' : ''}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" color="text.secondary" paragraph>
              특정 조건에 맞는 행들의 값을 합산합니다.
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                  <InputLabel>조건 열 선택</InputLabel>
                  <Select
                    value={aggregateOperation.conditionColumn}
                    onChange={handleAggregateChange('conditionColumn')}
                    label="조건 열 선택"
                  >
                    {columns.map((column, index) => (
                      <MenuItem key={index} value={column}>{column}</MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>이 열의 값이 일치하는 행을 찾습니다</FormHelperText>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="조건 값"
                  value={aggregateOperation.conditionValue}
                  onChange={handleAggregateChange('conditionValue')}
                  sx={{ mb: 2 }}
                />
              </Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                  <InputLabel>집계할 열 선택</InputLabel>
                  <Select
                    value={aggregateOperation.aggregateColumn}
                    onChange={handleAggregateChange('aggregateColumn')}
                    label="집계할 열 선택"
                  >
                    {columns.map((column, index) => (
                      <MenuItem key={index} value={column}>{column}</MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>이 열의 값들을 합산합니다</FormHelperText>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="결과 저장 열 (선택사항)"
                  value={aggregateOperation.resultColumn}
                  onChange={handleAggregateChange('resultColumn')}
                  sx={{ mb: 2 }}
                />
                <FormHelperText>비워두면 결과만 반환됩니다</FormHelperText>
              </Grid>
            </Grid>

            {/* 대시보드 저장 옵션 */}
            <Box sx={{ mt: 2, mb: 2 }}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" gutterBottom>
                대시보드 옵션
              </Typography>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={aggregateOperation.saveToDashboard}
                    onChange={handleAggregateChange('saveToDashboard')}
                    color="primary"
                  />
                }
                label="집계 결과를 대시보드에 저장"
              />
              
              {aggregateOperation.saveToDashboard && (
                <TextField
                  fullWidth
                  size="small"
                  label="대시보드 이름"
                  value={aggregateOperation.dashboardName}
                  onChange={handleAggregateChange('dashboardName')}
                  sx={{ mt: 1 }}
                  helperText="집계 결과를 구분할 대시보드 이름 (예: 재고관리, 판매실적 등)"
                />
              )}
            </Box>

            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                color="info"
                onClick={handleAddAggregateOperation}
                disabled={
                  !aggregateOperation.conditionColumn ||
                  aggregateOperation.conditionValue === '' ||
                  !aggregateOperation.aggregateColumn
                }
                startIcon={editingIndex >= 0 ? <EditIcon /> : <AddIcon />}
              >
                {editingIndex >= 0 && operations[editingIndex]?.type === 'conditional_aggregate' ? '집계 작업 수정' : '집계 작업 추가'}
              </Button>
              
              {editingIndex >= 0 && operations[editingIndex]?.type === 'conditional_aggregate' && (
                <Button
                  variant="outlined"
                  onClick={resetForms}
                >
                  취소
                </Button>
              )}
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* 조건부 텍스트 추가 */}
        <Accordion expanded={expanded === 'panel4'} onChange={handleExpandChange('panel4')}>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel4a-content"
            id="panel4a-header"
          >
            <Typography sx={{ display: 'flex', alignItems: 'center' }}>
              <FunctionsIcon sx={{ mr: 1 }} />
              조건부 텍스트 추가 {editingIndex >= 0 && operations[editingIndex]?.type === 'conditional_text_append' ? '(편집 중)' : ''}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" color="text.secondary" paragraph>
              특정 조건에 따라 텍스트를 추가합니다.
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                  <InputLabel>조건 열 선택</InputLabel>
                  <Select
                    value={textAppendOperation.conditionColumn}
                    onChange={handleTextAppendChange('conditionColumn')}
                    label="조건 열 선택"
                  >
                    {columns.map((column, index) => (
                      <MenuItem key={index} value={column}>{column}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="조건 값"
                  value={textAppendOperation.conditionValue}
                  onChange={handleTextAppendChange('conditionValue')}
                  sx={{ mb: 2 }}
                />
              </Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                  <InputLabel>원본 열 선택</InputLabel>
                  <Select
                    value={textAppendOperation.sourceColumn}
                    onChange={handleTextAppendChange('sourceColumn')}
                    label="원본 열 선택"
                  >
                    {columns.map((column, index) => (
                      <MenuItem key={index} value={column}>{column}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="추가할 텍스트"
                  value={textAppendOperation.appendText}
                  onChange={handleTextAppendChange('appendText')}
                />
              </Grid>
            </Grid>
            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel>결과 저장 열</InputLabel>
              <Select
                value={textAppendOperation.targetColumn}
                onChange={handleTextAppendChange('targetColumn')}
                label="결과 저장 열"
              >
                {columns.map((column, index) => (
                  <MenuItem key={index} value={column}>{column}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                color="warning"
                onClick={handleAddTextAppendOperation}
                disabled={
                  !textAppendOperation.conditionColumn ||
                  !textAppendOperation.conditionValue ||
                  !textAppendOperation.sourceColumn ||
                  !textAppendOperation.appendText ||
                  !textAppendOperation.targetColumn
                }
                startIcon={editingIndex >= 0 ? <EditIcon /> : <AddIcon />}
              >
                {editingIndex >= 0 && operations[editingIndex]?.type === 'conditional_text_append' ? '텍스트 추가 수정' : '텍스트 추가 추가'}
              </Button>
              
              {editingIndex >= 0 && operations[editingIndex]?.type === 'conditional_text_append' && (
                <Button
                  variant="outlined"
                  onClick={resetForms}
                >
                  취소
                </Button>
              )}
            </Box>
          </AccordionDetails>
        </Accordion>
      </Paper>

      {columns.length > 0 && operations.length === 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          데이터 처리 작업을 추가하세요. 여러 작업을 순서대로 실행할 수 있습니다.
        </Alert>
      )}
    </Box>
  );
}

export default OperationsPanel; 