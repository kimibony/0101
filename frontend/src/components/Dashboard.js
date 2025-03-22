import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Grid,
  Divider,
  Stack,
  Chip,
} from '@mui/material';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import axios from 'axios';

// ChartJS 등록
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// 랜덤 색상 생성 함수
const getRandomColor = () => {
  const colors = [
    'rgb(255, 99, 132)',
    'rgb(54, 162, 235)',
    'rgb(255, 206, 86)',
    'rgb(75, 192, 192)',
    'rgb(153, 102, 255)',
    'rgb(255, 159, 64)',
    'rgb(199, 199, 199)',
    'rgb(83, 102, 255)',
    'rgb(40, 159, 143)',
    'rgb(205, 97, 85)'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

// 오늘 날짜를 YYYY-MM-DD 형식으로 반환
const getTodayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// 30일 전 날짜를 YYYY-MM-DD 형식으로 반환
const getLastMonthDate = () => {
  const date = new Date();
  date.setDate(date.getDate() - 30);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

function Dashboard() {
  // 상태 변수들
  const [startDate, setStartDate] = useState(getLastMonthDate());
  const [endDate, setEndDate] = useState(getTodayDate());
  const [dashboardName, setDashboardName] = useState('기본 대시보드');
  const [dashboardNames, setDashboardNames] = useState([]);
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 대시보드 이름 가져오기
  useEffect(() => {
    const fetchDashboardNames = async () => {
      try {
        const response = await axios.get('/api/dashboard/names');
        if (response.data.success) {
          setDashboardNames(response.data.dashboardNames);
        }
      } catch (err) {
        console.error('대시보드 이름 가져오기 실패:', err);
        setError('대시보드 이름을 가져오는 데 실패했습니다');
      }
    };

    fetchDashboardNames();
  }, []);

  // 집계 데이터 가져오기
  const fetchAggregationData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get('/api/dashboard/aggregations', {
        params: {
          start_date: startDate,
          end_date: endDate,
          dashboard_name: dashboardName
        }
      });

      if (response.data.success) {
        const data = response.data.data;
        
        // 차트 데이터 포맷 설정
        const formattedData = {
          labels: data.labels,
          datasets: data.datasets.map((dataset, index) => ({
            label: dataset.label,
            data: dataset.data,
            backgroundColor: getRandomColor(),
            borderColor: getRandomColor(),
            borderWidth: 1,
            barThickness: 25,
            maxBarThickness: 30
          }))
        };
        
        setChartData(formattedData);
      } else {
        setError('데이터를 가져오는 데 실패했습니다');
      }
    } catch (err) {
      console.error('집계 데이터 가져오기 실패:', err);
      setError(`데이터를 가져오는 데 실패했습니다: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 데이터셋별 총합 계산
  const calculateTotals = () => {
    if (!chartData) return [];
    
    return chartData.datasets.map(dataset => ({
      label: dataset.label,
      total: dataset.data.reduce((sum, value) => sum + value, 0),
      color: dataset.backgroundColor
    }));
  };

  // 날짜 범위 유효성 검사
  const isDateRangeValid = () => {
    return startDate && endDate && startDate <= endDate;
  };

  // 차트 옵션
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: `${dashboardName} 대시보드 - 집계 결과`,
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      }
    },
    scales: {
      y: {
        beginAtZero: true
      },
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 45
        }
      }
    },
    maintainAspectRatio: false
  };

  // 날짜 변경 핸들러
  const handleStartDateChange = (event) => {
    setStartDate(event.target.value);
  };

  const handleEndDateChange = (event) => {
    setEndDate(event.target.value);
  };

  // 오늘 날짜 조회 핸들러
  const handleTodayQuery = () => {
    const today = getTodayDate();
    setStartDate(today);
    setEndDate(today);
    
    // 날짜 설정 후 바로 데이터 조회
    setTimeout(() => {
      fetchAggregationData();
    }, 100);
  };

  // 최근 7일 조회 핸들러
  const handleLastWeekQuery = () => {
    const today = new Date();
    const lastWeek = new Date(today);
    lastWeek.setDate(today.getDate() - 6); // 오늘 포함 7일이므로 6일 전
    
    const formattedToday = getTodayDate();
    const year = lastWeek.getFullYear();
    const month = String(lastWeek.getMonth() + 1).padStart(2, '0');
    const day = String(lastWeek.getDate()).padStart(2, '0');
    const formattedLastWeek = `${year}-${month}-${day}`;
    
    setStartDate(formattedLastWeek);
    setEndDate(formattedToday);
    
    // 날짜 설정 후 바로 데이터 조회
    setTimeout(() => {
      fetchAggregationData();
    }, 100);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        집계 결과 대시보드
      </Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          조회 조건
        </Typography>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel>대시보드 선택</InputLabel>
              <Select
                value={dashboardName}
                onChange={(e) => setDashboardName(e.target.value)}
                label="대시보드 선택"
              >
                {dashboardNames.map((name) => (
                  <MenuItem key={name} value={name}>
                    {name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              size="small"
              label="시작 날짜"
              type="date"
              value={startDate}
              onChange={handleStartDateChange}
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              size="small"
              label="종료 날짜"
              type="date"
              value={endDate}
              onChange={handleEndDateChange}
              InputLabelProps={{
                shrink: true,
              }}
              inputProps={{
                min: startDate
              }}
            />
          </Grid>
        </Grid>

        {/* 빠른 날짜 선택 버튼 */}
        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ mr: 1, alignSelf: 'center' }}>
            빠른 조회:
          </Typography>
          <Chip 
            label="오늘" 
            size="small" 
            color="primary" 
            variant="outlined" 
            onClick={handleTodayQuery} 
            sx={{ cursor: 'pointer' }}
          />
          <Chip 
            label="최근 7일" 
            size="small" 
            color="primary" 
            variant="outlined" 
            onClick={handleLastWeekQuery} 
            sx={{ cursor: 'pointer' }}
          />
        </Stack>

        <Button
          variant="contained"
          onClick={fetchAggregationData}
          disabled={loading || !isDateRangeValid()}
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {loading ? '데이터 가져오는 중...' : '데이터 조회'}
        </Button>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {chartData && (
        <Paper sx={{ p: 2 }}>
          {/* 기간별 총합계 정보 */}
          <Box sx={{ mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid rgba(0,0,0,0.12)' }}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
              기간 내 총 합계 ({startDate} ~ {endDate})
            </Typography>
            <Grid container spacing={2}>
              {calculateTotals().map((item, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    p: 1.5,
                    borderRadius: 1,
                    border: '1px solid rgba(0,0,0,0.08)',
                    bgcolor: 'rgba(255,255,255,0.8)'
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Box 
                        sx={{ 
                          width: 12, 
                          height: 12, 
                          borderRadius: '50%', 
                          backgroundColor: item.color,
                          mr: 1 
                        }} 
                      />
                      <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                        {item.label}
                      </Typography>
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {item.total.toLocaleString()}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>

          <Box sx={{ height: 400 }}>
            <Bar data={chartData} options={chartOptions} />
          </Box>
          
          <Divider sx={{ my: 3 }} />
          
          <Typography variant="subtitle2" gutterBottom>
            데이터 테이블
          </Typography>
          
          <Box sx={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>날짜</th>
                  {chartData.datasets.map((dataset, index) => (
                    <th key={index} style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
                      {dataset.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {chartData.labels.map((label, rowIndex) => (
                  <tr key={rowIndex}>
                    <td style={{ padding: '8px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>{label}</td>
                    {chartData.datasets.map((dataset, colIndex) => (
                      <td key={colIndex} style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                        {dataset.data[rowIndex].toLocaleString()}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
        </Paper>
      )}
    </Box>
  );
}

export default Dashboard; 