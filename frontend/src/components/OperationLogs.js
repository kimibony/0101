import React from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse,
  Divider,
  Chip,
  Badge,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FunctionsIcon from '@mui/icons-material/Functions';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

function OperationLogs({ logs = [], totalAffectedRows = 0 }) {
  const [expandedItems, setExpandedItems] = React.useState({});

  // 로그 항목 확장/축소 토글
  const handleToggleExpand = (index) => {
    setExpandedItems((prev) => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // 로그 내용 클립보드에 복사
  const handleCopyLog = (log) => {
    const logText = `
작업 유형: ${getOperationTypeText(log.type)}
설명: ${log.description}
결과: ${log.result}
영향받은 행: ${log.affectedRows}
상태: ${log.status === 'success' ? '성공' : '실패'}
${log.type === 'conditional_replace' && log.conditions ? 
`조건 정보:
${log.conditions.join('\n')}` : ''}
${log.type === 'conditional_aggregate' ? 
`집계 값: ${log.sumValue !== undefined ? log.sumValue : '없음'}` : ''}
    `.trim();
    
    navigator.clipboard.writeText(logText)
      .then(() => {
        console.log('로그가 클립보드에 복사되었습니다.');
      })
      .catch(err => {
        console.error('클립보드 복사 실패:', err);
      });
  };
  
  // 작업 유형별 아이콘 및 색상 표시
  const getLogIcon = (type) => {
    switch(type) {
      case 'replace':
        return <SwapHorizIcon color="primary" />;
      case 'conditional_replace':
        return <FormatListBulletedIcon color="secondary" />;
      case 'conditional_aggregate':
        return <FunctionsIcon color="info" />;
      default:
        return null;
    }
  };
  
  // 작업 유형 텍스트 표시
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
  
  // 상태 표시용 아이콘
  const getStatusIcon = (status) => {
    return status === 'success' 
      ? <CheckCircleIcon color="success" fontSize="small" /> 
      : <ErrorIcon color="error" fontSize="small" />;
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        작업 로그
      </Typography>
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom sx={{ mb: 0 }}>
            총 {logs.length}개 작업 실행 ({totalAffectedRows}개 행에 영향)
          </Typography>
          <Chip 
            label={`${logs.filter(log => log.status === 'success').length}개 성공 / ${logs.filter(log => log.status === 'error').length}개 실패`}
            color={logs.every(log => log.status === 'success') ? 'success' : 'warning'}
            size="small" 
          />
        </Box>
        
        {logs.length > 0 ? (
          <List sx={{ width: '100%', bgcolor: 'background.paper', pt: 0 }}>
            {logs.map((log, index) => (
              <React.Fragment key={index}>
                {index > 0 && <Divider component="li" />}
                <ListItem
                  secondaryAction={
                    <Box>
                      <Tooltip title="로그 복사">
                        <IconButton edge="end" size="small" onClick={() => handleCopyLog(log)} sx={{ mr: 1 }}>
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <IconButton edge="end" onClick={() => handleToggleExpand(index)}>
                        {expandedItems[index] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                    </Box>
                  }
                  sx={{
                    bgcolor: log.status === 'error' ? 'error.lightest' : 'inherit'
                  }}
                >
                  <ListItemIcon>
                    <Badge
                      badgeContent={getStatusIcon(log.status)}
                      anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'right',
                      }}
                    >
                      {getLogIcon(log.type)}
                    </Badge>
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Chip 
                          label={getOperationTypeText(log.type)} 
                          size="small" 
                          color={
                            log.type === 'replace' 
                              ? 'primary' 
                              : log.type === 'conditional_replace' 
                                ? 'secondary' 
                                : 'info'
                          }
                          variant="outlined"
                          sx={{ mr: 1 }}
                        />
                        <Typography variant="body2" component="span">
                          {log.description}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Typography variant="body2" color={log.status === 'error' ? 'error' : 'text.secondary'}>
                        {log.result}
                      </Typography>
                    }
                  />
                </ListItem>
                <Collapse in={expandedItems[index]} timeout="auto" unmountOnExit>
                  <Box sx={{ pl: 4, pr: 2, pb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      상세 정보
                    </Typography>
                    
                    <TableContainer component={Paper} variant="outlined" sx={{ mb: 1 }}>
                      <Table size="small">
                        <TableBody>
                          <TableRow>
                            <TableCell component="th" sx={{ width: '30%', fontWeight: 'bold' }}>
                              작업 유형
                            </TableCell>
                            <TableCell>{getOperationTypeText(log.type)}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell component="th" sx={{ fontWeight: 'bold' }}>
                              영향받은 행 수
                            </TableCell>
                            <TableCell>{log.affectedRows}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell component="th" sx={{ fontWeight: 'bold' }}>
                              상태
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                {getStatusIcon(log.status)}
                                <Typography sx={{ ml: 1 }}>
                                  {log.status === 'success' ? '성공' : '실패'}
                                </Typography>
                              </Box>
                            </TableCell>
                          </TableRow>
                          {log.type === 'conditional_aggregate' && log.sumValue !== undefined && (
                            <TableRow>
                              <TableCell component="th" sx={{ fontWeight: 'bold' }}>
                                집계 결과
                              </TableCell>
                              <TableCell>{log.sumValue}</TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    
                    {log.type === 'conditional_replace' && log.conditions && log.conditions.length > 0 && (
                      <>
                        <Typography variant="subtitle2" gutterBottom>
                          조건 정보
                        </Typography>
                        <List dense disablePadding>
                          {log.conditions.map((condition, idx) => (
                            <ListItem key={idx} sx={{ py: 0.5 }}>
                              <ListItemText primary={condition} />
                            </ListItem>
                          ))}
                        </List>
                      </>
                    )}
                  </Box>
                </Collapse>
              </React.Fragment>
            ))}
          </List>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
            아직 실행된 작업이 없습니다. 작업을 실행하면 여기에 로그가 표시됩니다.
          </Typography>
        )}
      </Paper>
    </Box>
  );
}

export default OperationLogs; 