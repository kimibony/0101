import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  TextField,
  InputAdornment,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Snackbar,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  Check as CheckIcon,
  Block as BlockIcon,
  AdminPanelSettings as AdminIcon,
  PersonOff as PersonOffIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import axios from 'axios';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    message: '',
    action: null,
    userId: null,
    actionType: ''
  });

  // 사용자 목록 가져오기
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/auth/admin/users');
      setUsers(response.data.users);
      setFilteredUsers(response.data.users);
    } catch (error) {
      console.error('사용자 목록 조회 중 오류 발생:', error);
      setSnackbar({
        open: true,
        message: `사용자 목록 조회 중 오류가 발생했습니다: ${error.response?.data?.message || error.message}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 사용자 목록 가져오기
  useEffect(() => {
    fetchUsers();
  }, []);

  // 검색어에 따라 사용자 필터링
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchTerm, users]);

  // 확인 대화상자 열기
  const openConfirmDialog = (userId, actionType) => {
    let title = '';
    let message = '';
    let action = null;

    const user = users.find(u => u.id === userId);
    if (!user) return;

    switch (actionType) {
      case 'approve':
        title = '사용자 승인';
        message = `${user.username} 사용자를 승인하시겠습니까?`;
        action = () => approveUser(userId);
        break;
      case 'block':
        title = '사용자 차단';
        message = `${user.username} 사용자를 차단하시겠습니까? 차단된 사용자는 로그인할 수 없습니다.`;
        action = () => blockUser(userId);
        break;
      case 'activate':
        title = '사용자 활성화';
        message = `${user.username} 사용자를 활성화하시겠습니까?`;
        action = () => activateUser(userId);
        break;
      case 'setAdmin':
        title = user.is_admin ? '관리자 권한 해제' : '관리자 권한 부여';
        message = user.is_admin
          ? `${user.username} 사용자의 관리자 권한을 해제하시겠습니까?`
          : `${user.username} 사용자에게 관리자 권한을 부여하시겠습니까?`;
        action = () => setAdminPrivilege(userId, !user.is_admin);
        break;
      default:
        return;
    }

    setConfirmDialog({
      open: true,
      title,
      message,
      action,
      userId,
      actionType
    });
  };

  // 확인 대화상자 닫기
  const closeConfirmDialog = () => {
    setConfirmDialog({
      ...confirmDialog,
      open: false
    });
  };

  // 확인 후 작업 수행
  const handleConfirm = () => {
    if (confirmDialog.action) {
      confirmDialog.action();
    }
    closeConfirmDialog();
  };

  // 사용자 승인
  const approveUser = async (userId) => {
    try {
      const response = await axios.post(`/api/auth/admin/users/${userId}/approve`);
      
      // 사용자 목록 업데이트
      setUsers(users.map(user => 
        user.id === userId ? { ...user, account_status: 'active' } : user
      ));
      
      setSnackbar({
        open: true,
        message: response.data.message,
        severity: 'success'
      });
    } catch (error) {
      console.error('사용자 승인 중 오류 발생:', error);
      setSnackbar({
        open: true,
        message: `사용자 승인 중 오류가 발생했습니다: ${error.response?.data?.message || error.message}`,
        severity: 'error'
      });
    }
  };

  // 사용자 차단
  const blockUser = async (userId) => {
    try {
      const response = await axios.post(`/api/auth/admin/users/${userId}/block`);
      
      // 사용자 목록 업데이트
      setUsers(users.map(user => 
        user.id === userId ? { ...user, account_status: 'blocked' } : user
      ));
      
      setSnackbar({
        open: true,
        message: response.data.message,
        severity: 'success'
      });
    } catch (error) {
      console.error('사용자 차단 중 오류 발생:', error);
      setSnackbar({
        open: true,
        message: `사용자 차단 중 오류가 발생했습니다: ${error.response?.data?.message || error.message}`,
        severity: 'error'
      });
    }
  };

  // 사용자 활성화
  const activateUser = async (userId) => {
    try {
      const response = await axios.post(`/api/auth/admin/users/${userId}/activate`);
      
      // 사용자 목록 업데이트
      setUsers(users.map(user => 
        user.id === userId ? { ...user, account_status: 'active' } : user
      ));
      
      setSnackbar({
        open: true,
        message: response.data.message,
        severity: 'success'
      });
    } catch (error) {
      console.error('사용자 활성화 중 오류 발생:', error);
      setSnackbar({
        open: true,
        message: `사용자 활성화 중 오류가 발생했습니다: ${error.response?.data?.message || error.message}`,
        severity: 'error'
      });
    }
  };

  // 관리자 권한 설정
  const setAdminPrivilege = async (userId, isAdmin) => {
    try {
      const response = await axios.post(`/api/auth/admin/users/${userId}/set-admin`, {
        is_admin: isAdmin
      });
      
      // 사용자 목록 업데이트
      setUsers(users.map(user => 
        user.id === userId ? { ...user, is_admin: isAdmin } : user
      ));
      
      setSnackbar({
        open: true,
        message: response.data.message,
        severity: 'success'
      });
    } catch (error) {
      console.error('관리자 권한 설정 중 오류 발생:', error);
      setSnackbar({
        open: true,
        message: `관리자 권한 설정 중 오류가 발생했습니다: ${error.response?.data?.message || error.message}`,
        severity: 'error'
      });
    }
  };

  // 계정 상태에 따른 칩 렌더링
  const renderStatusChip = (status) => {
    switch (status) {
      case 'pending':
        return <Chip label="승인 대기중" color="warning" size="small" />;
      case 'active':
        return <Chip label="활성화" color="success" size="small" />;
      case 'blocked':
        return <Chip label="차단됨" color="error" size="small" />;
      default:
        return <Chip label={status} size="small" />;
    }
  };

  // Snackbar 닫기
  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Container maxWidth="lg">
      <Paper sx={{ p: 3, mt: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" component="h1">
            사용자 관리
          </Typography>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchUsers}
          >
            새로고침
          </Button>
        </Box>

        <TextField
          fullWidth
          variant="outlined"
          placeholder="사용자명 또는 이메일로 검색"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ mb: 3 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {filteredUsers.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="body1">사용자가 없습니다.</Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>ID</TableCell>
                      <TableCell>사용자명</TableCell>
                      <TableCell>이메일</TableCell>
                      <TableCell>가입일</TableCell>
                      <TableCell>계정 상태</TableCell>
                      <TableCell>관리자</TableCell>
                      <TableCell>작업</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.id}</TableCell>
                        <TableCell>{user.username}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          {new Date(user.created_at).toLocaleDateString('ko-KR')}
                        </TableCell>
                        <TableCell>{renderStatusChip(user.account_status)}</TableCell>
                        <TableCell>
                          {user.is_admin ? (
                            <Chip 
                              icon={<AdminIcon />} 
                              label="관리자" 
                              color="primary" 
                              size="small" 
                            />
                          ) : (
                            <Chip 
                              label="일반 사용자" 
                              variant="outlined" 
                              size="small" 
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            {user.account_status === 'pending' && (
                              <Button
                                size="small"
                                variant="outlined"
                                color="success"
                                startIcon={<CheckIcon />}
                                onClick={() => openConfirmDialog(user.id, 'approve')}
                              >
                                승인
                              </Button>
                            )}
                            {user.account_status === 'blocked' && (
                              <Button
                                size="small"
                                variant="outlined"
                                color="success"
                                startIcon={<CheckIcon />}
                                onClick={() => openConfirmDialog(user.id, 'activate')}
                              >
                                활성화
                              </Button>
                            )}
                            {user.account_status === 'active' && (
                              <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                startIcon={<BlockIcon />}
                                onClick={() => openConfirmDialog(user.id, 'block')}
                              >
                                차단
                              </Button>
                            )}
                            <Button
                              size="small"
                              variant="outlined"
                              color={user.is_admin ? 'warning' : 'primary'}
                              startIcon={user.is_admin ? <PersonOffIcon /> : <AdminIcon />}
                              onClick={() => openConfirmDialog(user.id, 'setAdmin')}
                            >
                              {user.is_admin ? '관리자 해제' : '관리자 지정'}
                            </Button>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </>
        )}
      </Paper>

      {/* 확인 대화상자 */}
      <Dialog
        open={confirmDialog.open}
        onClose={closeConfirmDialog}
      >
        <DialogTitle>{confirmDialog.title}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {confirmDialog.message}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeConfirmDialog}>취소</Button>
          <Button 
            onClick={handleConfirm} 
            color={confirmDialog.actionType === 'block' ? 'error' : 'primary'}
            autoFocus
          >
            확인
          </Button>
        </DialogActions>
      </Dialog>

      {/* 알림 Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AdminDashboard; 