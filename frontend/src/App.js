import React, { useState, useEffect } from 'react';
import { ThemeProvider, CssBaseline, Box, Container, AppBar, Toolbar, Typography, IconButton, Menu, MenuItem, Snackbar, Alert, CircularProgress, Backdrop, Tabs, Tab, Button } from '@mui/material';
import PaletteIcon from '@mui/icons-material/Palette';
import StorageIcon from '@mui/icons-material/Storage';
import DashboardIcon from '@mui/icons-material/Dashboard';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import FileUpload from './components/FileUpload';
import DataTable from './components/DataTable';
import OperationsPanel from './components/OperationsPanel';
import TemplateManager from './components/TemplateManager';
import UniqueValuesList from './components/UniqueValuesList';
import OperationLogs from './components/OperationLogs';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import Register from './components/Register';
import AdminDashboard from './components/AdminDashboard';
import themes from './themes';
import axios from 'axios';

// API 기본 URL 설정
axios.defaults.baseURL = 'http://localhost:5000';

// 인증 토큰을 Axios 요청 헤더에 추가하는 인터셉터
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 인증 오류 처리 인터셉터 (401 에러 시 로그아웃)
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // 토큰이 만료되었거나 인증에 실패한 경우
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// 보호된 라우트 컴포넌트
const ProtectedRoute = ({ children, requireAdmin }) => {
  const isAuthenticated = localStorage.getItem('token') !== null;
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user?.is_admin === true;
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" />;
  }
  
  return children;
};

function AppContent() {
  // 테마 상태
  const [currentTheme, setCurrentTheme] = useState('default');
  
  // 메뉴 상태
  const [anchorEl, setAnchorEl] = useState(null);
  const [userMenuAnchorEl, setUserMenuAnchorEl] = useState(null);
  
  // 탭 상태
  const [currentTab, setCurrentTab] = useState(0);
  
  // 데이터 상태
  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [filename, setFilename] = useState('');
  
  // 작업 상태
  const [operations, setOperations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // 로그 상태
  const [logs, setLogs] = useState([]);
  const [totalAffectedRows, setTotalAffectedRows] = useState(0);
  
  // 사용자 상태
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
  
  // 알림 상태
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  
  const navigate = useNavigate();
  
  // 사용자 인증 상태 확인
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await axios.get('/api/auth/me');
          setUser(response.data.user);
        } catch (error) {
          console.error('인증 확인 중 오류 발생:', error);
          // 인증 오류 시 로그아웃
          handleLogout();
        }
      }
    };
    
    checkAuth();
  }, []);
  
  // 탭 변경 핸들러
  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };
  
  // 테마 메뉴 핸들러
  const handleThemeMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleThemeMenuClose = () => {
    setAnchorEl(null);
  };
  
  const handleThemeChange = (theme) => {
    setCurrentTheme(theme);
    handleThemeMenuClose();
  };
  
  // 사용자 메뉴 핸들러
  const handleUserMenuOpen = (event) => {
    setUserMenuAnchorEl(event.currentTarget);
  };
  
  const handleUserMenuClose = () => {
    setUserMenuAnchorEl(null);
  };
  
  // 관리자 페이지로 이동
  const handleAdminDashboard = () => {
    setUserMenuAnchorEl(null);
    navigate('/admin');
  };
  
  // 로그아웃 핸들러
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setUserMenuAnchorEl(null);
    navigate('/login');
  };
  
  // 로그인 핸들러
  const handleLogin = (userData) => {
    setUser(userData);
  };
  
  // 파일 업로드 핸들러
  const handleFileUpload = (response) => {
    console.log('파일 업로드 응답:', response);
    
    // 응답이 올바르게 왔는지 확인
    if (!response || !response.success) {
      console.error('유효하지 않은 응답 형식:', response);
      setSnackbar({
        open: true,
        message: '파일 업로드 중 오류가 발생했습니다: 유효하지 않은 응답 형식',
        severity: 'error'
      });
      return;
    }
    
    // 응답 데이터 구조를 콘솔에 출력
    console.log('응답 데이터 전체 구조:', response);
    
    // 데이터와 컬럼 정보 확인 및 설정
    // 응답 구조에 맞게 data와 columns를 직접 추출
    const responseData = response.data || [];
    const responseColumns = response.columns || [];
    
    console.log('처리된 데이터:', responseData);
    console.log('데이터 길이:', Array.isArray(responseData) ? responseData.length : 0);
    console.log('컬럼:', responseColumns);
    
    // 필요한 경우 데이터 구조 변환
    // 서버에서 오는 데이터 구조가 바로 사용할 수 있는 형태가 아니라면 변환 필요
    const processedData = Array.isArray(responseData) ? responseData : [];
    
    // 상태 업데이트
    setData(processedData);
    setColumns(responseColumns);
    setFilename(response.filename || '');
    
    // 파일 업로드 시 작업 초기화
    setOperations([]);
    setLogs([]);
    setTotalAffectedRows(0);
    
    // 성공 메시지 표시
    setSnackbar({
      open: true,
      message: `"${response.filename || '파일'}" 파일이 성공적으로 로드되었습니다. ${processedData.length}개 행이 있습니다.`,
      severity: 'success'
    });
  };
  
  // 데이터 처리 핸들러
  const handleProcessData = async () => {
    if (!data.length || !operations.length) {
      setSnackbar({
        open: true,
        message: '처리할 데이터 또는 작업이 없습니다',
        severity: 'warning'
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log('작업 데이터 전송:', { 
        operations: operations,
        dataLength: data.length
      });
      
      const response = await axios.post('/api/process', {
        data,
        operations
      });
      
      if (response.data.success) {
        console.log('작업 결과 받음:', {
          resultLength: response.data.data.length,
          logs: response.data.logs
        });
        
        setData(response.data.data);
        setLogs(response.data.logs || []);
        setTotalAffectedRows(response.data.totalAffectedRows || 0);
        
        // 로그 상태에 따른 메시지 설정
        const allSuccess = response.data.allSuccess;
        const message = allSuccess
          ? `데이터가 성공적으로 처리되었습니다. ${response.data.totalAffectedRows}개 행이 변경되었습니다.`
          : '일부 작업이 실패했습니다. 자세한 내용은 로그를 확인하세요.';
        
        setSnackbar({
          open: true,
          message: message,
          severity: allSuccess ? 'success' : 'warning'
        });
      }
    } catch (error) {
      console.error('데이터 처리 중 오류 발생:', error);
      
      // 오류 발생 시 로그 정보가 있다면 설정
      if (error.response?.data?.logs) {
        setLogs(error.response.data.logs);
      }
      
      setSnackbar({
        open: true,
        message: `데이터 처리 중 오류가 발생했습니다: ${error.response?.data?.error || error.message}`,
        severity: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // 파일 내보내기 핸들러
  const handleExportFile = async () => {
    if (!data.length) {
      setSnackbar({
        open: true,
        message: '내보낼 데이터가 없습니다',
        severity: 'warning'
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // 파일명에서 공백과 특수문자 제거하여 안전한 파일명 생성
      const safeFilename = (filename || 'export')
        .replace(/\s+/g, '_')
        .replace(/[^a-zA-Z0-9_.-]/g, '')
        .toLowerCase();
      
      // 확장자가 없는 경우에만 .xlsx 추가
      const fileWithExt = safeFilename.endsWith('.xlsx') ? safeFilename : safeFilename + '.xlsx';
      
      console.log('파일 내보내기 요청:', { 
        filename: fileWithExt,
        originalFilename: filename,
        dataLength: data.length,
        columns: columns // 컬럼 순서 정보
      });
      
      const response = await axios.post('/api/export', {
        data,
        filename: fileWithExt,
        columns: columns // 컬럼 순서 정보 추가
      });
      
      console.log('파일 내보내기 응답:', response.data);
      
      if (response.data.success) {
        // 토큰 가져오기
        const token = localStorage.getItem('token');
        const userId = user?.id;
        
        if (!token || !userId) {
          throw new Error('인증 정보가 없습니다. 다시 로그인해주세요.');
        }
        
        try {
          // 다운로드 URL이 전체 URL이 아닌 경우 전체 URL로 변환
          let downloadUrl = response.data.download_url;
          // downloadUrl이 /로 시작하는 상대 경로인 경우만 처리
          if (downloadUrl.startsWith('/')) {
            downloadUrl = `${axios.defaults.baseURL}${downloadUrl}`;
          }
          
          console.log('GET 요청을 보내는 다운로드 URL:', downloadUrl);
          
          // 헤더에 인증 토큰을 명시적으로 포함
          const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          };
          
          console.log('요청 헤더:', headers);
          
          // 파일 다운로드 요청
          const downloadResponse = await axios({
            method: 'GET',
            url: downloadUrl,
            responseType: 'blob',
            headers: headers
          });
          
          console.log('다운로드 응답:', downloadResponse.status, downloadResponse.headers);
          
          // 응답 유효성 확인
          if (!downloadResponse.data) {
            throw new Error('다운로드 응답에 데이터가 없습니다');
          }
          
          // Blob URL 생성 및 다운로드
          const blob = new Blob([downloadResponse.data]);
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = response.data.filename || fileWithExt;
          document.body.appendChild(link);
          link.click();
          window.URL.revokeObjectURL(url); // 메모리 누수 방지
          document.body.removeChild(link);
          
          setSnackbar({
            open: true,
            message: '파일이 성공적으로 다운로드되었습니다',
            severity: 'success'
          });
        } catch (downloadError) {
          console.error('파일 다운로드 중 오류:', downloadError);
          console.error('오류 세부정보:', downloadError.response || downloadError.message);
          
          // 명확한 오류 메시지 제공
          let errorMessage = '파일 다운로드 중 오류가 발생했습니다';
          if (downloadError.response) {
            if (downloadError.response.status === 404) {
              errorMessage += ': 파일을 찾을 수 없습니다 (404). 백엔드 로그를 확인하세요.';
            } else if (downloadError.response.status === 401) {
              errorMessage += ': 인증 오류 (401). 다시 로그인하세요.';
            } else {
              errorMessage += `: 서버 오류 (${downloadError.response.status})`;
            }
          } else {
            errorMessage += `: ${downloadError.message}`;
          }
          
          setSnackbar({
            open: true,
            message: errorMessage,
            severity: 'error'
          });
        }
      } else {
        throw new Error(response.data.error || '서버 응답 오류');
      }
    } catch (error) {
      console.error('파일 내보내기 중 오류 발생:', error);
      setSnackbar({
        open: true,
        message: `파일 내보내기 중 오류가 발생했습니다: ${error.response?.data?.error || error.message}`,
        severity: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // 템플릿 적용 핸들러
  const handleApplyTemplate = (templateOperations) => {
    setOperations(templateOperations);
    setSnackbar({
      open: true,
      message: `템플릿이 적용되었습니다. ${templateOperations.length}개 작업이 로드되었습니다.`,
      severity: 'success'
    });
  };
  
  // 고유값을 작업에 추가하는 핸들러
  const handleAddToOperation = (type, valueData) => {
    // 기존 작업 패널의 작업 추가 로직과 유사하게 처리
    if (type === 'replace') {
      // 데이터 변환 작업에 추가
      const newOperation = {
        type: 'replace',
        sourceColumn: valueData.sourceColumn,
        targetColumn: valueData.sourceColumn, // 기본적으로 같은 열 선택
        searchValue: valueData.searchValue,
        replaceValue: '' // 빈값으로 초기화
      };
      
      setOperations([...operations, newOperation]);
      setSnackbar({
        open: true,
        message: `"${valueData.sourceColumn}" 열의 "${valueData.searchValue}" 값을 찾는 변환 작업이 추가되었습니다`,
        severity: 'success'
      });
    } 
    else if (type === 'conditional_replace') {
      // 조건부 변환 작업에 추가
      const newOperation = {
        type: 'conditional_replace',
        conditions: [{
          column: valueData.column,
          value: valueData.value
        }],
        targetColumn: '', // 사용자가 나중에 선택
        resultValue: '' // 사용자가 나중에 입력
      };
      
      setOperations([...operations, newOperation]);
      setSnackbar({
        open: true,
        message: `"${valueData.column}" 열의 "${valueData.value}" 값에 대한 조건부 변환 작업이 추가되었습니다`,
        severity: 'success'
      });
    }
    else if (type === 'conditional_aggregate') {
      // 조건부 집계 작업에 추가
      const newOperation = {
        type: 'conditional_aggregate',
        conditionColumn: valueData.column,
        conditionValue: valueData.value,
        aggregateColumn: '', // 사용자가 나중에 선택
        resultColumn: '', // 사용자가 나중에 선택
        saveToDashboard: false
      };
      
      setOperations([...operations, newOperation]);
      setSnackbar({
        open: true,
        message: `"${valueData.column}" 열의 "${valueData.value}" 값에 대한 조건부 집계 작업이 추가되었습니다`,
        severity: 'success'
      });
    }
  };
  
  // Snackbar 닫기 핸들러
  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };
  
  // 대시보드로 이동 핸들러
  const handleNavigateToDashboard = () => {
    setCurrentTab(1);
  };

  // 메인 앱 UI 렌더링
  return (
    <ThemeProvider theme={themes[currentTheme]}>
      <CssBaseline />
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static">
          <Toolbar>
            <StorageIcon sx={{ mr: 2 }} />
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              엑셀 데이터 처리 도구
            </Typography>
            
            {user && (
              <>
                <Tabs
                  value={currentTab}
                  onChange={handleTabChange}
                  textColor="inherit"
                  indicatorColor="secondary"
                  sx={{ mr: 2 }}
                >
                  <Tab label="데이터 처리" />
                  <Tab label="대시보드" />
                </Tabs>
                
                <IconButton color="inherit" onClick={handleThemeMenuOpen}>
                  <PaletteIcon />
                </IconButton>
                
                <IconButton 
                  color="inherit" 
                  edge="end" 
                  onClick={handleUserMenuOpen}
                  sx={{ ml: 1 }}
                >
                  <AccountCircleIcon />
                </IconButton>
                
                <Menu
                  anchorEl={userMenuAnchorEl}
                  open={Boolean(userMenuAnchorEl)}
                  onClose={handleUserMenuClose}
                >
                  <MenuItem disabled>
                    <Typography variant="body2" color="textSecondary">
                      {user ? user.username : '사용자'}
                    </Typography>
                  </MenuItem>
                  {user && user.is_admin && (
                    <MenuItem onClick={handleAdminDashboard}>
                      <AdminPanelSettingsIcon fontSize="small" sx={{ mr: 1 }} />
                      관리자 페이지
                    </MenuItem>
                  )}
                  <MenuItem onClick={handleLogout}>
                    <LogoutIcon fontSize="small" sx={{ mr: 1 }} />
                    로그아웃
                  </MenuItem>
                </Menu>
              </>
            )}
            
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleThemeMenuClose}
            >
              {Object.keys(themes).map((theme) => (
                <MenuItem
                  key={theme}
                  onClick={() => handleThemeChange(theme)}
                  selected={currentTheme === theme}
                >
                  {themes[theme].palette.name}
                </MenuItem>
              ))}
            </Menu>
          </Toolbar>
        </AppBar>
        
        <Container maxWidth="xl" sx={{ mt: 3 }}>
          {user && currentTab === 0 && (
            <Box>
              <Box sx={{ display: 'flex', mt: 3, mb: 2 }}>
                <Box sx={{ width: '60%', pr: 2 }}>
                  <FileUpload onFileUpload={handleFileUpload} />
                  
                  {data.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <DataTable data={data} columns={columns} />
                    </Box>
                  )}
                </Box>
                
                <Box sx={{ width: '40%' }}>
                  <TemplateManager
                    operations={operations}
                    onApplyTemplate={handleApplyTemplate}
                  />
                  
                  <Box sx={{ mt: 2 }}>
                    <OperationsPanel
                      columns={columns}
                      operations={operations}
                      setOperations={setOperations}
                      onProcessData={handleProcessData}
                      onExportFile={handleExportFile}
                      onNavigateToDashboard={handleNavigateToDashboard}
                    />
                  </Box>
                  
                  {columns.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <UniqueValuesList 
                        data={data} 
                        columns={columns}
                        onAddToOperation={handleAddToOperation}
                      />
                    </Box>
                  )}
                </Box>
              </Box>
              
              {logs.length > 0 && (
                <Box sx={{ mt: 2, mb: 4 }}>
                  <OperationLogs logs={logs} totalAffectedRows={totalAffectedRows} />
                </Box>
              )}
            </Box>
          )}
          
          {user && currentTab === 1 && (
            <Box sx={{ mt: 2 }}>
              <Dashboard />
            </Box>
          )}
        </Container>
      </Box>
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
      
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={isLoading}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    </ThemeProvider>
  );
}

function App() {
  return (
    <ThemeProvider theme={themes['default']}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/login" element={<Login onLogin={(user) => {}} />} />
          <Route path="/register" element={<Register />} />
          <Route 
            path="/*" 
            element={
              <ProtectedRoute>
                <AppContent />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/*" 
            element={
              <ProtectedRoute requireAdmin={true}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App; 