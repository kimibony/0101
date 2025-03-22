import React, { useState, useEffect, useRef } from 'react';
import { 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  TablePagination,
  Box,
  Typography,
  Alert,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Divider,
  IconButton,
  Tooltip,
  Button
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import CloseIcon from '@mui/icons-material/Close';

function DataTable({ data, columns }) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [rowHeight, setRowHeight] = useState(53); // 기본 행 높이
  const [columnWidths, setColumnWidths] = useState({}); // 열 너비 상태
  const [dragging, setDragging] = useState(null); // 드래그 중인 열
  const [startX, setStartX] = useState(0); // 드래그 시작 X 좌표
  const [startWidth, setStartWidth] = useState(0); // 드래그 시작 시 너비
  const [showSettings, setShowSettings] = useState(false); // 설정 창 표시 여부
  const tableRef = useRef(null);
  
  // 초기 열 너비 설정
  useEffect(() => {
    if (columns && columns.length > 0) {
      const initialWidths = {};
      columns.forEach((col) => {
        initialWidths[col] = 150; // 기본 너비 150px
      });
      setColumnWidths(initialWidths);
    }
  }, [columns]);
  
  // 디버깅을 위한 데이터 상태 로깅
  useEffect(() => {
    console.log('DataTable 컴포넌트 렌더링:');
    console.log('데이터 배열:', data);
    console.log('데이터 타입:', typeof data);
    console.log('데이터 길이:', data ? data.length : 0);
    console.log('컬럼 정보:', columns);
  }, [data, columns]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // 행 높이 변경 핸들러
  const handleRowHeightChange = (event, newValue) => {
    setRowHeight(newValue);
  };
  
  // 열 너비 드래그 시작 핸들러
  const handleDragStart = (e, column) => {
    setDragging(column);
    setStartX(e.clientX);
    setStartWidth(columnWidths[column]);
    
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
  };
  
  // 열 너비 드래그 중 핸들러
  const handleDragMove = (e) => {
    if (dragging) {
      const diff = e.clientX - startX;
      const newWidth = Math.max(50, startWidth + diff); // 최소 50px
      
      setColumnWidths({
        ...columnWidths,
        [dragging]: newWidth
      });
    }
  };
  
  // 열 너비 드래그 종료 핸들러
  const handleDragEnd = () => {
    setDragging(null);
    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('mouseup', handleDragEnd);
  };
  
  // 설정 창 토글
  const toggleSettings = () => {
    setShowSettings(!showSettings);
  };
  
  // 모든 열 너비 초기화
  const resetColumnWidths = () => {
    const initialWidths = {};
    columns.forEach((col) => {
      initialWidths[col] = 150; // 기본 너비 150px
    });
    setColumnWidths(initialWidths);
    setRowHeight(53); // 기본 행 높이
  };
  
  // 특정 열의 너비 변경 핸들러
  const handleColumnWidthChange = (column, width) => {
    setColumnWidths({
      ...columnWidths,
      [column]: width
    });
  };

  // 데이터가 없는 경우
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Alert severity="info" sx={{ mb: 2 }}>
          데이터가 없습니다. 파일을 업로드하거나 다시 시도해주세요.
        </Alert>
        <Typography variant="body2" color="text.secondary">
          업로드한 파일에 데이터가 포함되어 있는지 확인해주세요.
        </Typography>
      </Paper>
    );
  }

  // 컬럼이 없는 경우
  if (!columns || !Array.isArray(columns) || columns.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Alert severity="warning">
          열(컬럼) 정보가 없습니다.
        </Alert>
        <Typography variant="body2" color="text.secondary">
          업로드한 파일의 형식을 확인해주세요.
        </Typography>
      </Paper>
    );
  }

  // 데이터 예시 로그
  console.log('데이터 첫 번째 항목:', data.length > 0 ? data[0] : null);
  
  // 데이터의 첫 행을 확인하여 모든 컬럼이 있는지 확인
  const firstRow = data[0] || {};
  const missingColumns = columns.filter(col => !(col in firstRow));
  
  if (missingColumns.length > 0) {
    console.warn('일부 컬럼이 데이터에 없습니다:', missingColumns);
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h6" gutterBottom>
          데이터 미리보기 ({data.length}행)
        </Typography>
        <Tooltip title="테이블 설정">
          <IconButton onClick={toggleSettings}>
            <SettingsIcon />
          </IconButton>
        </Tooltip>
      </Box>
      
      {showSettings && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="h6">테이블 설정</Typography>
            <IconButton onClick={toggleSettings}>
              <CloseIcon />
            </IconButton>
          </Box>
          
          <Divider sx={{ my: 1 }} />
          
          <Box sx={{ mb: 2 }}>
            <Typography gutterBottom>행 높이: {rowHeight}px</Typography>
            <Slider
              value={rowHeight}
              onChange={handleRowHeightChange}
              min={30}
              max={100}
              step={1}
              marks={[
                { value: 30, label: '30px' },
                { value: 53, label: '기본' },
                { value: 100, label: '100px' },
              ]}
            />
          </Box>
          
          <Typography gutterBottom>열 너비:</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {columns.map((column) => (
              <TextField
                key={column}
                label={column}
                type="number"
                size="small"
                value={columnWidths[column] || 150}
                onChange={(e) => handleColumnWidthChange(column, Number(e.target.value))}
                InputProps={{ inputProps: { min: 50, max: 500 } }}
                sx={{ width: 150, mb: 1 }}
              />
            ))}
          </Box>
          
          <Box sx={{ mt: 2, textAlign: 'right' }}>
            <Tooltip title="모든 설정을 기본값으로 초기화합니다">
              <Button variant="outlined" color="primary" onClick={resetColumnWidths} sx={{ mr: 1 }}>
                초기화
              </Button>
            </Tooltip>
          </Box>
        </Paper>
      )}
      
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 440 }} ref={tableRef}>
          <Table stickyHeader aria-label="데이터 테이블">
            <TableHead>
              <TableRow>
                <TableCell 
                  sx={{ 
                    backgroundColor: (theme) => theme.palette.primary.main,
                    color: 'white',
                    width: 60,
                    minWidth: 60
                  }}
                >
                  #
                </TableCell>
                {columns.map((column, index) => (
                  <TableCell 
                    key={index}
                    sx={{ 
                      backgroundColor: (theme) => theme.palette.primary.main,
                      color: 'white',
                      width: columnWidths[column] || 150,
                      minWidth: columnWidths[column] || 150,
                      position: 'relative',
                      userSelect: 'none'
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>{column}</span>
                      <Box 
                        sx={{ 
                          position: 'absolute',
                          right: 0,
                          top: 0,
                          height: '100%',
                          width: '5px',
                          cursor: 'col-resize',
                          '&:hover': {
                            backgroundColor: 'rgba(255, 255, 255, 0.3)'
                          }
                        }}
                        onMouseDown={(e) => handleDragStart(e, column)}
                      />
                    </Box>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {data
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((row, rowIndex) => (
                  <TableRow 
                    hover 
                    key={rowIndex}
                    sx={{ height: `${rowHeight}px` }}
                  >
                    <TableCell component="th" scope="row">
                      {page * rowsPerPage + rowIndex + 1}
                    </TableCell>
                    {columns.map((column, colIndex) => (
                      <TableCell 
                        key={colIndex}
                        sx={{ 
                          width: columnWidths[column] || 150,
                          maxWidth: columnWidths[column] || 150,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {row[column] !== null && row[column] !== undefined 
                          ? String(row[column]) 
                          : ''}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={data.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="행 개수:"
          labelDisplayedRows={({ from, to, count }) => 
            `${from}-${to} / 총 ${count}`
          }
        />
      </Paper>
    </Box>
  );
}

export default DataTable; 