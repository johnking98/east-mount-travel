import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Search, Download, Edit2, Trash2, Car, Users, Briefcase, MapPin, Phone, Clock, X, LogOut, Eye, EyeOff, Shield, User } from 'lucide-react';

const EastMountTravelSystem = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loginForm, setLoginForm] = useState({ username: '', password: '', showPassword: false });
  const [bookings, setBookings] = useState([]);
  const [activeView, setActiveView] = useState('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    serviceType: '接机',
    date: '',
    time: '',
    flightNumber: '',
    pickup: '',
    dropoff: '',
    passengers: '',
    childAge: '',
    luggage: '',
    luggageSize: '28寸',
    customerName: '',
    customerPhone: '',
    notes: ''
  });

  // 预设用户账号（实际使用时应该存储在安全的后端）
  const users = {
    admin: { password: 'admin123', role: 'admin', name: '管理员' },
    manager: { password: 'manager123', role: 'admin', name: '经理' },
    staff: { password: 'staff123', role: 'viewer', name: '员工' },
    viewer: { password: 'viewer123', role: 'viewer', name: '查看者' }
  };

  // 加载数据
  useEffect(() => {
    if (isLoggedIn) {
      loadBookings();
    }
  }, [isLoggedIn]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const result = await window.storage.get('east-mount-bookings', true);
      if (result && result.value) {
        setBookings(JSON.parse(result.value));
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveBookings = async (newBookings) => {
    try {
      await window.storage.set('east-mount-bookings', JSON.stringify(newBookings), true);
      setBookings(newBookings);
    } catch (error) {
      console.error('保存数据失败:', error);
      alert('保存失败，请重试');
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    const user = users[loginForm.username];
    if (user && user.password === loginForm.password) {
      setCurrentUser({ username: loginForm.username, ...user });
      setIsLoggedIn(true);
      setLoginForm({ username: '', password: '', showPassword: false });
    } else {
      alert('用户名或密码错误');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setShowForm(false);
    setEditingBooking(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (currentUser.role !== 'admin') {
      alert('您没有权限执行此操作');
      return;
    }

    let newBookings;
    if (editingBooking) {
      newBookings = bookings.map(b => b.id === editingBooking.id ? { ...formData, id: b.id, updatedBy: currentUser.name, updatedAt: new Date().toISOString() } : b);
      setEditingBooking(null);
    } else {
      const newBooking = { 
        ...formData, 
        id: Date.now().toString(),
        createdBy: currentUser.name,
        createdAt: new Date().toISOString()
      };
      newBookings = [...bookings, newBooking];
    }
    
    await saveBookings(newBookings);
    resetForm();
    setShowForm(false);
  };

  const resetForm = () => {
    setFormData({
      serviceType: '接机',
      date: '',
      time: '',
      flightNumber: '',
      pickup: '',
      dropoff: '',
      passengers: '',
      childAge: '',
      luggage: '',
      luggageSize: '28寸',
      customerName: '',
      customerPhone: '',
      notes: ''
    });
  };

  const handleEdit = (booking) => {
    if (currentUser.role !== 'admin') {
      alert('您没有权限编辑订单');
      return;
    }
    setFormData(booking);
    setEditingBooking(booking);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (currentUser.role !== 'admin') {
      alert('您没有权限删除订单');
      return;
    }
    if (window.confirm('确定要删除这个订单吗？')) {
      const newBookings = bookings.filter(b => b.id !== id);
      await saveBookings(newBookings);
    }
  };

  const handleExport = () => {
    const headers = ['服务类型', '日期', '时间', '航班号', '上车地点', '下车地点', '乘客人数', '儿童年龄', '行李数量', '行李尺寸', '客户姓名', '联系电话', '备注', '创建人', '创建时间'];
    const rows = bookings.map(b => [
      b.serviceType, b.date, b.time, b.flightNumber, b.pickup, b.dropoff,
      b.passengers, b.childAge || '', b.luggage, b.luggageSize,
      b.customerName, b.customerPhone, b.notes || '', b.createdBy || '', b.createdAt || ''
    ]);
    
    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `东山国际旅游订单_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = 
      booking.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.flightNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.customerPhone.includes(searchTerm);
    const matchesDate = !filterDate || booking.date === filterDate;
    return matchesSearch && matchesDate;
  }).sort((a, b) => {
    const dateA = new Date(a.date + ' ' + a.time);
    const dateB = new Date(b.date + ' ' + b.time);
    return dateA - dateB;
  });

  const groupedByDate = filteredBookings.reduce((acc, booking) => {
    if (!acc[booking.date]) acc[booking.date] = [];
    acc[booking.date].push(booking);
    return acc;
  }, {});

  // 登录页面
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4" style={{ fontFamily: "'Outfit', 'Noto Sans SC', sans-serif" }}>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Noto+Sans+SC:wght@300;400;500;700;900&display=swap" rel="stylesheet" />
        
        <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl rounded-3xl shadow-2xl p-12 max-w-md w-full border border-white/10">
          <div className="text-center mb-10">
            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Car className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">东山国际旅游</h1>
            <p className="text-cyan-300 text-lg font-medium tracking-wide">East Mount Luxury Travel</p>
            <p className="text-gray-400 mt-4">专业包车接送机管理系统</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-gray-300 font-medium mb-2">用户名</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
                  className="w-full pl-12 pr-4 py-3.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all"
                  placeholder="请输入用户名"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-300 font-medium mb-2">密码</label>
              <div className="relative">
                <Shield className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={loginForm.showPassword ? 'text' : 'password'}
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                  className="w-full pl-12 pr-12 py-3.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all"
                  placeholder="请输入密码"
                  required
                />
                <button
                  type="button"
                  onClick={() => setLoginForm({...loginForm, showPassword: !loginForm.showPassword})}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                >
                  {loginForm.showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white py-4 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] text-lg"
            >
              登录系统
            </button>
          </form>

          <div className="mt-8 p-4 bg-blue-500/10 border border-blue-400/20 rounded-xl">
            <p className="text-blue-300 text-sm font-medium mb-2">测试账号：</p>
            <div className="text-gray-300 text-xs space-y-1">
              <p>管理员: admin / admin123</p>
              <p>经理: manager / manager123</p>
              <p>员工: staff / staff123</p>
              <p>查看者: viewer / viewer123</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900" style={{ fontFamily: "'Outfit', 'Noto Sans SC', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Noto+Sans+SC:wght@300;400;500;700;900&display=swap" rel="stylesheet" />
      
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-500 shadow-2xl border-b-4 border-amber-400">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 backdrop-blur-sm p-3 rounded-2xl">
                <Car className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white tracking-tight">东山国际旅游</h1>
                <p className="text-blue-100 mt-1 text-lg tracking-wide">East Mount Luxury Travel</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 backdrop-blur-sm px-6 py-3 rounded-xl border border-white/30">
                <div className="flex items-center space-x-3">
                  {currentUser.role === 'admin' ? (
                    <Shield className="w-5 h-5 text-amber-300" />
                  ) : (
                    <User className="w-5 h-5 text-blue-200" />
                  )}
                  <div>
                    <p className="text-white font-semibold">{currentUser.name}</p>
                    <p className="text-blue-100 text-xs">{currentUser.role === 'admin' ? '管理员' : '查看者'}</p>
                  </div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-500/20 hover:bg-red-500/30 backdrop-blur-sm text-white px-6 py-3 rounded-xl font-semibold flex items-center space-x-2 transition-all border border-red-400/30"
              >
                <LogOut className="w-5 h-5" />
                <span>退出</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Action Bar */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl p-6 mb-8 border border-white/20">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveView('list')}
                className={`px-6 py-3 rounded-xl font-medium transition-all ${
                  activeView === 'list' 
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg' 
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                订单列表
              </button>
              <button
                onClick={() => setActiveView('calendar')}
                className={`px-6 py-3 rounded-xl font-medium transition-all ${
                  activeView === 'calendar' 
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg' 
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                日程视图
              </button>
            </div>
            <div className="flex space-x-4">
              {currentUser.role === 'admin' && (
                <button
                  onClick={() => { setShowForm(true); setEditingBooking(null); resetForm(); }}
                  className="bg-amber-400 hover:bg-amber-500 text-blue-900 px-6 py-3 rounded-xl font-semibold flex items-center space-x-2 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  <Plus className="w-5 h-5" />
                  <span>新建订单</span>
                </button>
              )}
              <button
                onClick={handleExport}
                disabled={bookings.length === 0}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-6 py-3 rounded-xl font-semibold flex items-center space-x-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-5 h-5" />
                <span>导出数据</span>
              </button>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl p-6 mb-8 border border-white/20">
          <div className="flex space-x-4 w-full">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="搜索客户、航班、电话..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
              />
            </div>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
            />
            {(searchTerm || filterDate) && (
              <button
                onClick={() => { setSearchTerm(''); setFilterDate(''); }}
                className="px-4 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-xl transition-all"
              >
                清除
              </button>
            )}
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-xl p-6 border border-blue-400/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">总订单数</p>
                <p className="text-4xl font-bold text-white mt-2">{bookings.length}</p>
              </div>
              <Briefcase className="w-12 h-12 text-blue-200" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-2xl shadow-xl p-6 border border-cyan-400/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-cyan-100 text-sm font-medium">今日订单</p>
                <p className="text-4xl font-bold text-white mt-2">
                  {bookings.filter(b => b.date === new Date().toISOString().split('T')[0]).length}
                </p>
              </div>
              <Calendar className="w-12 h-12 text-cyan-200" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl shadow-xl p-6 border border-amber-400/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-sm font-medium">总乘客数</p>
                <p className="text-4xl font-bold text-white mt-2">
                  {bookings.reduce((sum, b) => sum + (parseInt(b.passengers) || 0), 0)}
                </p>
              </div>
              <Users className="w-12 h-12 text-amber-200" />
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-xl p-16 text-center border border-white/20">
            <div className="animate-spin w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-400 text-xl">加载数据中...</p>
          </div>
        ) : (
          <>
            {/* Main Content */}
            {activeView === 'list' ? (
              <div className="space-y-4">
                {filteredBookings.length === 0 ? (
                  <div className="bg-white/5 backdrop-blur-md rounded-2xl shadow-xl p-16 text-center border border-white/10">
                    <Car className="w-20 h-20 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400 text-xl">暂无订单数据</p>
                    {currentUser.role === 'admin' && (
                      <p className="text-gray-500 mt-2">点击"新建订单"开始添加</p>
                    )}
                  </div>
                ) : (
                  filteredBookings.map((booking) => (
                    <div key={booking.id} className="bg-white/10 backdrop-blur-md rounded-2xl shadow-xl p-6 hover:bg-white/15 transition-all border border-white/20 transform hover:scale-[1.01]">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-6">
                          <div>
                            <div className="flex items-center space-x-2 mb-3">
                              <span className={`px-4 py-1.5 rounded-full text-sm font-semibold ${
                                booking.serviceType === '接机' 
                                  ? 'bg-green-500/20 text-green-300 border border-green-400/30' 
                                  : 'bg-orange-500/20 text-orange-300 border border-orange-400/30'
                              }`}>
                                {booking.serviceType}
                              </span>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center text-white">
                                <Clock className="w-4 h-4 mr-2 text-cyan-400" />
                                <span className="font-medium">{booking.date} {booking.time}</span>
                              </div>
                              <div className="text-cyan-300 font-mono font-semibold text-lg">
                                {booking.flightNumber}
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <p className="text-gray-400 text-sm mb-2">路线</p>
                            <div className="space-y-1">
                              <div className="flex items-start">
                                <MapPin className="w-4 h-4 mr-2 text-green-400 mt-1 flex-shrink-0" />
                                <span className="text-white">{booking.pickup}</span>
                              </div>
                              <div className="flex items-start">
                                <MapPin className="w-4 h-4 mr-2 text-red-400 mt-1 flex-shrink-0" />
                                <span className="text-white">{booking.dropoff}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <p className="text-gray-400 text-sm mb-2">乘客信息</p>
                            <div className="space-y-1">
                              <div className="flex items-center text-white font-medium">
                                <Users className="w-4 h-4 mr-2 text-blue-400" />
                                <span>{booking.passengers}人{booking.childAge && ` (${booking.childAge}岁)`}</span>
                              </div>
                              <div className="flex items-center text-white">
                                <Briefcase className="w-4 h-4 mr-2 text-purple-400" />
                                <span>{booking.luggage}件 ({booking.luggageSize})</span>
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <p className="text-gray-400 text-sm mb-2">客户联系</p>
                            <div className="space-y-1">
                              <div className="text-white font-medium">{booking.customerName}</div>
                              <div className="flex items-center text-cyan-300">
                                <Phone className="w-4 h-4 mr-2" />
                                <span className="font-mono">{booking.customerPhone}</span>
                              </div>
                              {booking.notes && (
                                <div className="mt-2 text-amber-300 text-sm bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-400/20">
                                  备注: {booking.notes}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {currentUser.role === 'admin' && (
                          <div className="flex space-x-2 ml-4">
                            <button
                              onClick={() => handleEdit(booking)}
                              className="p-3 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-xl transition-all"
                              title="编辑"
                            >
                              <Edit2 className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(booking.id)}
                              className="p-3 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-xl transition-all"
                              title="删除"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-xl p-8 border border-white/20">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                  <Calendar className="w-6 h-6 mr-3 text-cyan-400" />
                  日程安排
                </h2>
                {Object.keys(groupedByDate).length === 0 ? (
                  <div className="text-center py-16">
                    <Calendar className="w-20 h-20 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400 text-xl">暂无日程安排</p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {Object.keys(groupedByDate).sort().map(date => (
                      <div key={date}>
                        <div className="flex items-center mb-4">
                          <div className="bg-gradient-to-r from-cyan-500 to-blue-500 px-6 py-2 rounded-xl">
                            <h3 className="text-lg font-bold text-white">{date}</h3>
                          </div>
                          <div className="flex-1 h-px bg-gradient-to-r from-cyan-500/50 to-transparent ml-4"></div>
                        </div>
                        <div className="space-y-3 ml-4">
                          {groupedByDate[date].map(booking => (
                            <div key={booking.id} className="bg-white/5 rounded-xl p-5 border-l-4 border-cyan-400 hover:bg-white/10 transition-all">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-6">
                                  <div className="text-center">
                                    <div className="text-2xl font-bold text-white">{booking.time}</div>
                                    <div className={`text-sm font-medium mt-1 ${
                                      booking.serviceType === '接机' ? 'text-green-400' : 'text-orange-400'
                                    }`}>
                                      {booking.serviceType}
                                    </div>
                                  </div>
                                  <div className="h-12 w-px bg-white/20"></div>
                                  <div>
                                    <div className="text-white font-semibold text-lg">{booking.flightNumber}</div>
                                    <div className="text-gray-300 text-sm mt-1">
                                      {booking.pickup} → {booking.dropoff}
                                    </div>
                                    <div className="flex items-center space-x-4 mt-2 text-sm">
                                      <span className="text-blue-300">{booking.customerName}</span>
                                      <span className="text-gray-400">•</span>
                                      <span className="text-gray-400">{booking.passengers}人</span>
                                      <span className="text-gray-400">•</span>
                                      <span className="text-gray-400">{booking.luggage}件行李</span>
                                    </div>
                                  </div>
                                </div>
                                {currentUser.role === 'admin' && (
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={() => handleEdit(booking)}
                                      className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg transition-all"
                                    >
                                      <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDelete(booking.id)}
                                      className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-all"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-white/20 flex flex-col">
            <div className="bg-gradient-to-r from-blue-600 to-cyan-500 px-8 py-6 flex items-center justify-between border-b border-white/20">
              <h2 className="text-3xl font-bold text-white">
                {editingBooking ? '编辑订单' : '新建订单'}
              </h2>
              <button
                onClick={() => { setShowForm(false); setEditingBooking(null); resetForm(); }}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-all"
                title="关闭"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>
            
            <div className="overflow-y-auto flex-1 p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-300 font-medium mb-2">服务类型 *</label>
                    <select
                      value={formData.serviceType}
                      onChange={(e) => setFormData({...formData, serviceType: e.target.value})}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                      required
                    >
                      <option value="接机" className="bg-slate-800">接机</option>
                      <option value="送机" className="bg-slate-800">送机</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-gray-300 font-medium mb-2">航班号 *</label>
                    <input
                      type="text"
                      value={formData.flightNumber}
                      onChange={(e) => setFormData({...formData, flightNumber: e.target.value})}
                      placeholder="例如: CZ319"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-300 font-medium mb-2">日期 *</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-300 font-medium mb-2">时间 *</label>
                    <input
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData({...formData, time: e.target.value})}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-300 font-medium mb-2">上车地点 *</label>
                    <input
                      type="text"
                      value={formData.pickup}
                      onChange={(e) => setFormData({...formData, pickup: e.target.value})}
                      placeholder="例如: PER T1"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-300 font-medium mb-2">下车地点 *</label>
                    <input
                      type="text"
                      value={formData.dropoff}
                      onChange={(e) => setFormData({...formData, dropoff: e.target.value})}
                      placeholder="例如: 泛太平洋酒店"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-300 font-medium mb-2">乘客人数 *</label>
                    <input
                      type="number"
                      value={formData.passengers}
                      onChange={(e) => setFormData({...formData, passengers: e.target.value})}
                      placeholder="例如: 6"
                      min="1"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-300 font-medium mb-2">儿童年龄（可选）</label>
                    <input
                      type="number"
                      value={formData.childAge}
                      onChange={(e) => setFormData({...formData, childAge: e.target.value})}
                      placeholder="例如: 5"
                      min="0"
                      max="18"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-300 font-medium mb-2">行李数量 *</label>
                    <input
                      type="number"
                      value={formData.luggage}
                      onChange={(e) => setFormData({...formData, luggage: e.target.value})}
                      placeholder="例如: 4"
                      min="0"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-300 font-medium mb-2">行李尺寸</label>
                    <input
                      type="text"
                      value={formData.luggageSize}
                      onChange={(e) => setFormData({...formData, luggageSize: e.target.value})}
                      placeholder="例如: 28寸"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-300 font-medium mb-2">客户姓名 *</label>
                    <input
                      type="text"
                      value={formData.customerName}
                      onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                      placeholder="例如: 陈先生"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-300 font-medium mb-2">联系电话 *</label>
                    <input
                      type="tel"
                      value={formData.customerPhone}
                      onChange={(e) => setFormData({...formData, customerPhone: e.target.value})}
                      placeholder="例如: 13666611193"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                      required
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-gray-300 font-medium mb-2">备注（可选）</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      placeholder="例如: 增高垫*1"
                      rows="3"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent resize-none"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-4 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => { setShowForm(false); setEditingBooking(null); resetForm(); }}
                    className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold transition-all border border-white/20"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    {editingBooking ? '保存修改' : '创建订单'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        input[type="date"]::-webkit-calendar-picker-indicator,
        input[type="time"]::-webkit-calendar-picker-indicator {
          filter: invert(1);
          cursor: pointer;
        }
        select option {
          background-color: #1e293b;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default EastMountTravelSystem;