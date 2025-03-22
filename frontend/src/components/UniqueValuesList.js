import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  Button,
  Tooltip,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Radio,
  RadioGroup
} from '@mui/material';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import FunctionsIcon from '@mui/icons-material/Functions';
import axios from 'axios';

function UniqueValuesList({ data, columns, onAddToOperation }) {
  const [selectedColumn, setSelectedColumn] = useState('');
  const [uniqueValues, setUniqueValues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState('');
  const [operationType, setOperationType] = useState('replace');

  // 열 선택 시 고유값 가져오기
  const handleColumnChange = async (event) => {
    const column = event.target.value;
    setSelectedColumn(column);
    
    if (!column) {
      setUniqueValues([]);
      return;
    }
    
    setLoading(true);
    try {
      const response = await axios.post('/api/unique-values', {
        data,
        column
      });
      
      if (response.data.success) {
        setUniqueValues(response.data.uniqueValues);
      }
    } catch (error) {
      console.error('고유값 조회 중 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  // 고유값 클릭 처리 (작업 선택 다이얼로그 표시)
  const handleValueClick = (value) => {
    setSelectedValue(value);
    setDialogOpen(true);
  };

  // 선택한 고유값을 작업에 추가
  const handleAddToOperation = () => {
    if (operationType === 'replace') {
      onAddToOperation('replace', {
        sourceColumn: selectedColumn,
        searchValue: selectedValue
      });
    } else if (operationType === 'conditional_replace') {
      onAddToOperation('conditional_replace', {
        column: selectedColumn,
        value: selectedValue
      });
    } else if (operationType === 'conditional_aggregate') {
      onAddToOperation('conditional_aggregate', {
        conditionColumn: selectedColumn,
        conditionValue: selectedValue
      });
    }
    
    setDialogOpen(false);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        고유값 목록
      </Typography>
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <InputLabel>열 선택</InputLabel>
          <Select
            value={selectedColumn}
            onChange={handleColumnChange}
            label="열 선택"
          >
            <MenuItem value="">
              <em>선택하세요</em>
            </MenuItem>
            {columns.map((column, index) => (
              <MenuItem key={index} value={column}>{column}</MenuItem>
            ))}
          </Select>
        </FormControl>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {selectedColumn && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {uniqueValues.length}개의 고유값 발견
                </Typography>
                <Tooltip title="값을 클릭하여 작업에 추가할 수 있습니다">
                  <FormatListBulletedIcon color="action" fontSize="small" />
                </Tooltip>
              </Box>
            )}
            
            {uniqueValues.length > 0 && (
              <List sx={{ maxHeight: 300, overflow: 'auto', bgcolor: 'background.default', borderRadius: 1 }}>
                {uniqueValues.map((value, index) => (
                  <React.Fragment key={index}>
                    {index > 0 && <Divider component="li" />}
                    <ListItem 
                      button
                      onClick={() => handleValueClick(value)}
                      sx={{ 
                        '&:hover': { 
                          bgcolor: 'action.hover',
                          '& .MuiListItemSecondaryAction-root': {
                            visibility: 'visible'
                          }
                        } 
                      }}
                    >
                      <ListItemText 
                        primary={value === '' ? '(빈 값)' : value}
                        primaryTypographyProps={{
                          sx: { 
                            fontFamily: 'monospace',
                            fontSize: '0.9rem',
                            fontWeight: value === '' ? 'light' : 'normal',
                            fontStyle: value === '' ? 'italic' : 'normal'
                          }
                        }}
                      />
                      <ListItemSecondaryAction sx={{ visibility: 'hidden' }}>
                        <Tooltip title="작업에 추가">
                          <IconButton edge="end" size="small" onClick={() => handleValueClick(value)}>
                            <AddCircleOutlineIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </ListItemSecondaryAction>
                    </ListItem>
                  </React.Fragment>
                ))}
              </List>
            )}
          </>
        )}
      </Paper>
      
      {/* 작업 선택 다이얼로그 */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        aria-labelledby="operation-dialog-title"
      >
        <DialogTitle id="operation-dialog-title">
          작업 선택 - {selectedValue === '' ? '(빈 값)' : selectedValue}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            이 값을 어떤 작업에 사용할까요?
          </Typography>
          
          <RadioGroup
            aria-label="operation-type"
            name="operation-type"
            value={operationType}
            onChange={(e) => setOperationType(e.target.value)}
          >
            <FormControlLabel 
              value="replace" 
              control={<Radio />} 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <SwapHorizIcon sx={{ mr: 1, color: 'primary.main' }} fontSize="small" />
                  <Typography>데이터 변환 - 이 값을 찾아 변경</Typography>
                </Box>
              }
            />
            <FormControlLabel 
              value="conditional_replace" 
              control={<Radio />} 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <FormatListBulletedIcon sx={{ mr: 1, color: 'secondary.main' }} fontSize="small" />
                  <Typography>조건부 변환 - 이 값을 조건으로 사용</Typography>
                </Box>
              }
            />
            <FormControlLabel 
              value="conditional_aggregate" 
              control={<Radio />} 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <FunctionsIcon sx={{ mr: 1, color: 'info.main' }} fontSize="small" />
                  <Typography>조건부 집계 - 이 값을 조건으로 사용</Typography>
                </Box>
              } 
            />
          </RadioGroup>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>취소</Button>
          <Button onClick={handleAddToOperation} variant="contained">
            추가
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default UniqueValuesList; 