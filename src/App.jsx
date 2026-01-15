import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Search, Download, Edit2, Trash2, Car, Users, Briefcase, MapPin, Phone, Clock, X, LogOut, Eye, EyeOff, Shield, User, Settings, UserPlus, Check, XCircle, DollarSign, ChevronLeft, ChevronRight, Upload, Image as ImageIcon } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// Supabase 配置
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

const EastMountTravelSystem = () => {
  // 状态管理
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showRegister, setShowRegister] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '', showPassword: false });
  const [registerForm, setRegisterForm] = useState({ username: '', password: '', confirmPassword: '', displayName: '', showPassword: false });
  const [bookings, setBookings] = useState([]);
  const [activeView, setActiveView] = useState('list');
  const [calendarView, setCalendarView] = useState('schedule'); // 'schedule' or 'calendar'
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showPermissionRequests, setShowPermissionRequests] = useState(false);
  const [systemSettings, setSystemSettings] = useState({
    company_name_cn: '东山国际旅游',
    company_name_en: 'East Mount Luxury Travel',
    logo_url: ''
  });
  const [permissionRequests, setPermissionRequests] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
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
    notes: '',
    price: ''
  });

  // 加载系统设置
  const loadSystemSettings = async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .limit(1)
        .single();
      
      if (error) throw error;
      if (data) {
        setSystemSettings(data);
      }
    } catch (error) {
      console.error('加载系统设置失败:', error);
    }
  };

  // 加载数据
  useEffect(() => {
    if (isLoggedIn && supabase) {
      loadBookings();
      loadSystemSettings();
      if (currentUser?.role === 'admin') {
        loadPermissionRequests();
      }
      
      // 实时订阅
      const channel = supabase
        .channel('all-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => loadBookings())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'system_settings' }, () => loadSystemSettings())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'permission_requests' }, () => loadPermissionRequests())
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isLoggedIn]);

  const loadBookings = async () => {
    if (!supabase) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('date', { ascending: true })
        .order('time', { ascending: true });

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPermissionRequests = async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('permission_requests')
        .select('*')
        .eq('status', 'pending')
        .order('requested_at', { ascending: false });

      if (error) throw error;
      setPermissionRequests(data || []);
    } catch (error) {
      console.error('加载权限申请失败:', error);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!supabase) {
      alert('数据库未配置');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', loginForm.username)
        .eq('password', loginForm.password)
        .eq('status', 'active')
        .single();

      if (error || !data) {
        alert('用户名或密码错误');
        return;
      }

      setCurrentUser(data);
      setIsLoggedIn(true);
      setLoginForm({ username: '', password: '', showPassword: false });
    } catch (error) {
      console.error('登录失败:', error);
      alert('登录失败，请重试');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!supabase) {
      alert('数据库未配置');
      return;
    }

    if (registerForm.password !== registerForm.confirmPassword) {
      alert('两次输入的密码不一致');
      return;
    }

    if (registerForm.password.length < 6) {
      alert('密码长度至少6位');
      return;
    }

    try {
      // 检查用户名是否已存在
      const { data: existing } = await supabase
        .from('users')
        .select('username')
        .eq('username', registerForm.username)
        .single();

      if (existing) {
        alert('用户名已存在');
        return;
      }

      // 创建新用户
      const { error } = await supabase
        .from('users')
        .insert([{
          username: registerForm.username,
          password: registerForm.password,
          display_name: registerForm.displayName,
          role: 'viewer',
          status: 'active'
        }]);

      if (error) throw error;

      alert('注册成功！请登录');
      setShowRegister(false);
      setRegisterForm({ username: '', password: '', confirmPassword: '', displayName: '', showPassword: false });
    } catch (error) {
      console.error('注册失败:', error);
      alert('注册失败: ' + error.message);
    }
  };

  const handleRequestPermission = async () => {
    if (!supabase || !currentUser) return;

    const reason = prompt('请说明申请管理员权限的原因：');
    if (!reason) return;

    try {
      const { error } = await supabase
        .from('permission_requests')
        .insert([{
          user_id: currentUser.id,
          username: currentUser.username,
          requested_role: 'admin',
          reason: reason,
          status: 'pending'
        }]);

      if (error) throw error;
      alert('申请已提交，请等待管理员审批');
    } catch (error) {
      console.error('提交申请失败:', error);
      alert('提交申请失败: ' + error.message);
    }
  };

  const handleApproveRequest = async (requestId, userId, approve) => {
    if (!supabase) return;

    try {
      // 更新申请状态
      const { error: requestError } = await supabase
        .from('permission_requests')
        .update({
          status: approve ? 'approved' : 'rejected',
          processed_at: new Date().toISOString(),
          processed_by: currentUser.display_name
        })
        .eq('id', requestId);

      if (requestError) throw requestError;

      // 如果批准，更新用户权限
      if (approve) {
        const { error: userError } = await supabase
          .from('users')
          .update({ role: 'admin' })
          .eq('id', userId);

        if (userError) throw userError;
      }

      alert(approve ? '已批准申请' : '已拒绝申请');
      loadPermissionRequests();
    } catch (error) {
      console.error('处理申请失败:', error);
      alert('处理申请失败: ' + error.message);
    }
  };

  const handleUpdateSettings = async (newSettings) => {
    if (!supabase) return;

    try {
      const { error } = await supabase
        .from('system_settings')
        .update({
          ...newSettings,
          updated_at: new Date().toISOString(),
          updated_by: currentUser.display_name
        })
        .eq('id', 1);

      if (error) throw error;
      
      alert('设置更新成功！');
      loadSystemSettings();
      setShowSettings(false);
    } catch (error) {
      console.error('更新设置失败:', error);
      alert('更新设置失败: ' + error.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (currentUser.role !== 'admin') {
      alert('您没有权限执行此操作');
      return;
    }

    if (!supabase) return;

    try {
      setLoading(true);
      
      if (editingBooking) {
        const { error } = await supabase
          .from('bookings')
          .update({
            service_type: formData.serviceType,
            date: formData.date,
            time: formData.time,
            flight_number: formData.flightNumber,
            pickup: formData.pickup,
            dropoff: formData.dropoff,
            passengers: formData.passengers,
            child_age: formData.childAge || null,
            luggage: formData.luggage,
            luggage_size: formData.luggageSize,
            customer_name: formData.customerName,
            customer_phone: formData.customerPhone,
            notes: formData.notes || null,
            price: formData.price ? parseFloat(formData.price) : null,
            updated_by: currentUser.display_name,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingBooking.id);

        if (error) throw error;
        setEditingBooking(null);
      } else {
        const { error } = await supabase
          .from('bookings')
          .insert([{
            service_type: formData.serviceType,
            date: formData.date,
            time: formData.time,
            flight_number: formData.flightNumber,
            pickup: formData.pickup,
            dropoff: formData.dropoff,
            passengers: formData.passengers,
            child_age: formData.childAge || null,
            luggage: formData.luggage,
            luggage_size: formData.luggageSize,
            customer_name: formData.customerName,
            customer_phone: formData.customerPhone,
            notes: formData.notes || null,
            price: formData.price ? parseFloat(formData.price) : null,
            created_by: currentUser.display_name
          }]);

        if (error) throw error;
      }

      await loadBookings();
      resetForm();
      setShowForm(false);
      alert(editingBooking ? '订单更新成功！' : '订单创建成功！');
    } catch (error) {
      console.error('保存失败:', error);
      alert('保存失败: ' + error.message);
    } finally {
      setLoading(false);
    }
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
      notes: '',
      price: ''
    });
  };

  const handleEdit = (booking) => {
    if (currentUser.role !== 'admin') {
      alert('您没有权限编辑订单');
      return;
    }
    setFormData({
      serviceType: booking.service_type,
      date: booking.date,
      time: booking.time,
      flightNumber: booking.flight_number,
      pickup: booking.pickup,
      dropoff: booking.dropoff,
      passengers: booking.passengers,
      childAge: booking.child_age || '',
      luggage: booking.luggage,
      luggageSize: booking.luggage_size,
      customerName: booking.customer_name,
      customerPhone: booking.customer_phone,
      notes: booking.notes || '',
      price: booking.price || ''
    });
    setEditingBooking(booking);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (currentUser.role !== 'admin') {
      alert('您没有权限删除订单');
      return;
    }
    if (!supabase || !window.confirm('确定要删除这个订单吗？')) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadBookings();
      alert('订单删除成功！');
    } catch (error) {
      console.error('删除失败:', error);
      alert('删除失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const headers = ['服务类型', '日期', '时间', '航班号', '上车地点', '下车地点', '乘客人数', '儿童年龄', '行李数量', '行李尺寸', '客户姓名', '联系电话', '价格', '备注', '创建人', '创建时间'];
    const rows = bookings.map(b => [
      b.service_type, b.date, b.time, b.flight_number, b.pickup, b.dropoff,
      b.passengers, b.child_age || '', b.luggage, b.luggage_size,
      b.customer_name, b.customer_phone, b.price || '', b.notes || '', b.created_by || '', 
      b.created_at ? new Date(b.created_at).toLocaleString('zh-CN') : ''
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
      booking.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.flight_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.customer_phone?.includes(searchTerm);
    const matchesDate = !filterDate || booking.date === filterDate;
    return matchesSearch && matchesDate;
  });

  const groupedByDate = filteredBookings.reduce((acc, booking) => {
    if (!acc[booking.date]) acc[booking.date] = [];
    acc[booking.date].push(booking);
    return acc;
  }, {});

  // 日历视图相关函数
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const getBookingsForDate = (day) => {
    if (!day) return [];
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return filteredBookings.filter(b => b.date === dateStr);
  };

  // 登录/注册页面
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4" style={{ fontFamily: "'Outfit', 'Noto Sans SC', sans-serif" }}>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Noto+Sans+SC:wght@300;400;500;700;900&display=swap" rel="stylesheet" />
        
        <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl rounded-3xl shadow-2xl p-12 max-w-md w-full border border-white/10">
          <div className="text-center mb-10">
            {systemSettings.logo_url ? (
              <img src={systemSettings.logo_url} alt="Logo" className="w-20 h-20 rounded-2xl mx-auto mb-6 shadow-lg object-cover" />
            ) : (
              <div className="bg-gradient-to-r from-blue-500 to-cyan-500 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Car className="w-10 h-10 text-white" />
              </div>
            )}
            <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">{systemSettings.company_name_cn}</h1>
            <p className="text-cyan-300 text-lg font-medium tracking-wide">{systemSettings.company_name_en}</p>
            <p className="text-gray-400 mt-4">专业包车接送机管理系统</p>
            
            {!supabase && (
              <div className="mt-6 p-4 bg-red-500/20 border border-red-400/30 rounded-xl">
                <p className="text-red-300 text-sm">⚠️ 数据库未配置</p>
              </div>
            )}
          </div>

          {!showRegister ? (
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-gray-300 font-medium mb-2">用户名</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={loginForm.username}
                    onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
                    className="w-full pl-12 pr-4 py-3.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all"
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
                    className="w-full pl-12 pr-12 py-3.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all"
                    placeholder="请输入密码"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setLoginForm({...loginForm, showPassword: !loginForm.showPassword})}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
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

              <button
                type="button"
                onClick={() => setShowRegister(true)}
                className="w-full bg-white/10 hover:bg-white/20 text-white py-4 rounded-xl font-semibold transition-all border border-white/20 flex items-center justify-center space-x-2"
              >
                <UserPlus className="w-5 h-5" />
                <span>注册新账号</span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-5">
              <div>
                <label className="block text-gray-300 font-medium mb-2">用户名 *</label>
                <input
                  type="text"
                  value={registerForm.username}
                  onChange={(e) => setRegisterForm({...registerForm, username: e.target.value})}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  placeholder="请输入用户名"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 font-medium mb-2">显示名称 *</label>
                <input
                  type="text"
                  value={registerForm.displayName}
                  onChange={(e) => setRegisterForm({...registerForm, displayName: e.target.value})}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  placeholder="请输入显示名称"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 font-medium mb-2">密码 *（至少6位）</label>
                <div className="relative">
                  <input
                    type={registerForm.showPassword ? 'text' : 'password'}
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm({...registerForm, password: e.target.value})}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    placeholder="请输入密码"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setRegisterForm({...registerForm, showPassword: !registerForm.showPassword})}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400"
                  >
                    {registerForm.showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-gray-300 font-medium mb-2">确认密码 *</label>
                <input
                  type={registerForm.showPassword ? 'text' : 'password'}
                  value={registerForm.confirmPassword}
                  onChange={(e) => setRegisterForm({...registerForm, confirmPassword: e.target.value})}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  placeholder="请再次输入密码"
                  required
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => { setShowRegister(false); setRegisterForm({ username: '', password: '', confirmPassword: '', displayName: '', showPassword: false }); }}
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl font-semibold transition-all border border-white/20"
                >
                  返回登录
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white py-3 rounded-xl font-semibold transition-all shadow-lg"
                >
                  注册
                </button>
              </div>

              <div className="mt-4 p-3 bg-blue-500/10 border border-blue-400/20 rounded-xl">
                <p className="text-blue-300 text-xs">注册后默认为查看者权限，如需管理员权限请联系管理员</p>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  // 主界面
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900" style={{ fontFamily: "'Outfit', 'Noto Sans SC', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Noto+Sans+SC:wght@300;400;500;700;900&display=swap" rel="stylesheet" />
      
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-500 shadow-2xl border-b-4 border-amber-400">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {systemSettings.logo_url ? (
                <img src={systemSettings.logo_url} alt="Logo" className="w-12 h-12 rounded-xl object-cover border-2 border-white/30" />
              ) : (
                <div className="bg-white/20 backdrop-blur-sm p-3 rounded-2xl">
                  <Car className="w-10 h-10 text-white" />
                </div>
              )}
              <div>
                <h1 className="text-4xl font-bold text-white tracking-tight">{systemSettings.company_name_cn}</h1>
                <p className="text-blue-100 mt-1 text-lg tracking-wide">{systemSettings.company_name_en}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {currentUser.role === 'admin' && (
                <>
                  <button
                    onClick={() => setShowSettings(true)}
                    className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-4 py-3 rounded-xl font-semibold flex items-center space-x-2 transition-all border border-white/30"
                  >
                    <Settings className="w-5 h-5" />
                    <span>设置</span>
                  </button>
                  {permissionRequests.length > 0 && (
                    <button
                      onClick={() => setShowPermissionRequests(true)}
                      className="bg-amber-500/20 hover:bg-amber-500/30 backdrop-blur-sm text-amber-200 px-4 py-3 rounded-xl font-semibold flex items-center space-x-2 transition-all border border-amber-400/30 relative"
                    >
                      <Shield className="w-5 h-5" />
                      <span>权限申请</span>
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold">
                        {permissionRequests.length}
                      </span>
                    </button>
                  )}
                </>
              )}
              {currentUser.role === 'viewer' && (
                <button
                  onClick={handleRequestPermission}
                  className="bg-amber-500/20 hover:bg-amber-500/30 backdrop-blur-sm text-amber-200 px-4 py-3 rounded-xl font-semibold flex items-center space-x-2 transition-all border border-amber-400/30"
                >
                  <Shield className="w-5 h-5" />
                  <span>申请管理员权限</span>
                </button>
              )}
              <div className="bg-white/20 backdrop-blur-sm px-6 py-3 rounded-xl border border-white/30">
                <div className="flex items-center space-x-3">
                  {currentUser.role === 'admin' ? (
                    <Shield className="w-5 h-5 text-amber-300" />
                  ) : (
                    <User className="w-5 h-5 text-blue-200" />
                  )}
                  <div>
                    <p className="text-white font-semibold">{currentUser.display_name}</p>
                    <p className="text-blue-100 text-xs">{currentUser.role === 'admin' ? '管理员' : '查看者'}</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsLoggedIn(false);
                  setCurrentUser(null);
                }}
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
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-6 py-3 rounded-xl font-semibold flex items-center space-x-2 transition-all disabled:opacity-50"
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
                className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              />
            </div>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-xl p-6 border border-green-400/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">总收入</p>
                <p className="text-4xl font-bold text-white mt-2">
                  ${bookings.reduce((sum, b) => sum + (parseFloat(b.price) || 0), 0).toFixed(2)}
                </p>
              </div>
              <DollarSign className="w-12 h-12 text-green-200" />
            </div>
          </div>
        </div>

        {/* Main Content */}
        {loading && activeView === 'list' ? (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-xl p-16 text-center border border-white/20">
            <div className="animate-spin w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-400 text-xl">加载数据中...</p>
          </div>
        ) : (
          <>
            {activeView === 'list' ? (
              <div className="space-y-4">
                {filteredBookings.length === 0 ? (
                  <div className="bg-white/5 backdrop-blur-md rounded-2xl shadow-xl p-16 text-center border border-white/10">
                    <Car className="w-20 h-20 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400 text-xl">暂无订单数据</p>
                  </div>
                ) : (
                  filteredBookings.map((booking) => (
                    <div key={booking.id} className="bg-white/10 backdrop-blur-md rounded-2xl shadow-xl p-6 hover:bg-white/15 transition-all border border-white/20">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-6">
                          <div>
                            <div className="flex items-center space-x-2 mb-3">
                              <span className={`px-4 py-1.5 rounded-full text-sm font-semibold ${
                                booking.service_type === '接机' 
                                  ? 'bg-green-500/20 text-green-300 border border-green-400/30' 
                                  : 'bg-orange-500/20 text-orange-300 border border-orange-400/30'
                              }`}>
                                {booking.service_type}
                              </span>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center text-white">
                                <Clock className="w-4 h-4 mr-2 text-cyan-400" />
                                <span className="font-medium">{booking.date} {booking.time}</span>
                              </div>
                              <div className="text-cyan-300 font-mono font-semibold text-lg">
                                {booking.flight_number}
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
                                <span>{booking.passengers}人{booking.child_age && ` (${booking.child_age}岁)`}</span>
                              </div>
                              <div className="flex items-center text-white">
                                <Briefcase className="w-4 h-4 mr-2 text-purple-400" />
                                <span>{booking.luggage}件 ({booking.luggage_size})</span>
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <p className="text-gray-400 text-sm mb-2">客户联系</p>
                            <div className="space-y-1">
                              <div className="text-white font-medium">{booking.customer_name}</div>
                              <div className="flex items-center text-cyan-300">
                                <Phone className="w-4 h-4 mr-2" />
                                <span className="font-mono">{booking.customer_phone}</span>
                              </div>
                              {booking.notes && (
                                <div className="mt-2 text-amber-300 text-sm bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-400/20">
                                  备注: {booking.notes}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div>
                            <p className="text-gray-400 text-sm mb-2">价格</p>
                            <div className="flex items-center space-x-2">
                              <DollarSign className="w-5 h-5 text-green-400" />
                              <span className="text-3xl font-bold text-green-400">
                                {booking.price ? `$${parseFloat(booking.price).toFixed(2)}` : '未设置'}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {currentUser.role === 'admin' && (
                          <div className="flex space-x-2 ml-4">
                            <button
                              onClick={() => handleEdit(booking)}
                              className="p-3 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-xl transition-all"
                            >
                              <Edit2 className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(booking.id)}
                              className="p-3 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-xl transition-all"
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
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white flex items-center">
                    <Calendar className="w-6 h-6 mr-3 text-cyan-400" />
                    日程安排
                  </h2>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setCalendarView('schedule')}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        calendarView === 'schedule'
                          ? 'bg-cyan-500 text-white'
                          : 'bg-white/10 text-gray-300 hover:bg-white/20'
                      }`}
                    >
                      列表视图
                    </button>
                    <button
                      onClick={() => setCalendarView('calendar')}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        calendarView === 'calendar'
                          ? 'bg-cyan-500 text-white'
                          : 'bg-white/10 text-gray-300 hover:bg-white/20'
                      }`}
                    >
                      日历视图
                    </button>
                  </div>
                </div>

                {calendarView === 'schedule' ? (
                  Object.keys(groupedByDate).length === 0 ? (
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
                                  <div className="flex items-center space-x-6 flex-1">
                                    <div className="text-center">
                                      <div className="text-2xl font-bold text-white">{booking.time}</div>
                                      <div className={`text-sm font-medium mt-1 ${
                                        booking.service_type === '接机' ? 'text-green-400' : 'text-orange-400'
                                      }`}>
                                        {booking.service_type}
                                      </div>
                                    </div>
                                    <div className="h-12 w-px bg-white/20"></div>
                                    <div className="flex-1">
                                      <div className="text-white font-semibold text-lg">{booking.flight_number}</div>
                                      <div className="text-gray-300 text-sm mt-1">
                                        {booking.pickup} → {booking.dropoff}
                                      </div>
                                      <div className="flex items-center space-x-4 mt-2 text-sm">
                                        <span className="text-blue-300">{booking.customer_name}</span>
                                        <span className="text-gray-400">•</span>
                                        <span className="text-gray-400">{booking.passengers}人</span>
                                        <span className="text-gray-400">•</span>
                                        <span className="text-gray-400">{booking.luggage}件行李</span>
                                        {booking.price && (
                                          <>
                                            <span className="text-gray-400">•</span>
                                            <span className="text-green-400 font-semibold">${parseFloat(booking.price).toFixed(2)}</span>
                                          </>
                                        )}
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
                  )
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <button
                        onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                        className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all"
                      >
                        <ChevronLeft className="w-6 h-6 text-white" />
                      </button>
                      <h3 className="text-2xl font-bold text-white">
                        {currentMonth.getFullYear()}年 {currentMonth.getMonth() + 1}月
                      </h3>
                      <button
                        onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                        className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all"
                      >
                        <ChevronRight className="w-6 h-6 text-white" />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-7 gap-2">
                      {['日', '一', '二', '三', '四', '五', '六'].map(day => (
                        <div key={day} className="text-center text-gray-400 font-semibold py-3">
                          {day}
                        </div>
                      ))}
                      {getDaysInMonth(currentMonth).map((day, index) => {
                        const dayBookings = getBookingsForDate(day);
                        const isToday = day && 
                          currentMonth.getFullYear() === new Date().getFullYear() &&
                          currentMonth.getMonth() === new Date().getMonth() &&
                          day === new Date().getDate();
                        
                        return (
                          <div
                            key={index}
                            className={`min-h-[100px] p-2 rounded-lg border transition-all ${
                              day
                                ? dayBookings.length > 0
                                  ? 'bg-cyan-500/20 border-cyan-400/50 hover:bg-cyan-500/30'
                                  : 'bg-white/5 border-white/10 hover:bg-white/10'
                                : 'bg-transparent border-transparent'
                            } ${isToday ? 'ring-2 ring-amber-400' : ''}`}
                          >
                            {day && (
                              <>
                                <div className={`text-sm font-semibold mb-1 ${
                                  isToday ? 'text-amber-400' : 'text-white'
                                }`}>
                                  {day}
                                </div>
                                {dayBookings.length > 0 && (
                                  <div className="space-y-1">
                                    {dayBookings.slice(0, 2).map(booking => (
                                      <div
                                        key={booking.id}
                                        className="text-xs bg-blue-500/30 text-blue-200 px-2 py-1 rounded truncate cursor-pointer hover:bg-blue-500/50 transition-all"
                                        onClick={() => handleEdit(booking)}
                                        title={`${booking.time} ${booking.flight_number} - ${booking.customer_name}`}
                                      >
                                        {booking.time} {booking.flight_number}
                                      </div>
                                    ))}
                                    {dayBookings.length > 2 && (
                                      <div className="text-xs text-cyan-300 px-2">
                                        +{dayBookings.length - 2} 更多
                                      </div>
                                    )}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* 订单表单 Modal - 代码继续在下一部分 */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-white/20 flex flex-col">
            <div className="bg-gradient-to-r from-blue-600 to-cyan-500 px-8 py-6 flex items-center justify-between">
              <h2 className="text-3xl font-bold text-white">
                {editingBooking ? '编辑订单' : '新建订单'}
              </h2>
              <button
                onClick={() => { setShowForm(false); setEditingBooking(null); resetForm(); }}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-all"
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
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
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
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-300 font-medium mb-2">日期 *</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-300 font-medium mb-2">时间 *</label>
                    <input
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData({...formData, time: e.target.value})}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
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
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
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
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
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
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
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
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
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
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
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
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-300 font-medium mb-2">客户姓名 *</label>
                    <input
                      type="text"
                      value={formData.customerName}
                      onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                      placeholder="例如: 陈先生"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
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
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-300 font-medium mb-2">价格 ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                      placeholder="例如: 150.00"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-gray-300 font-medium mb-2">备注（可选）</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      placeholder="例如: 增高垫*1"
                      rows="3"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 resize-none"
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
                    disabled={loading}
                    className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-xl font-semibold transition-all shadow-lg disabled:opacity-50"
                  >
                    {loading ? '保存中...' : (editingBooking ? '保存修改' : '创建订单')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 设置 Modal */}
      {showSettings && (
        <SettingsModal
          settings={systemSettings}
          onSave={handleUpdateSettings}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* 权限申请 Modal */}
      {showPermissionRequests && (
        <PermissionRequestsModal
          requests={permissionRequests}
          onApprove={(id, userId) => handleApproveRequest(id, userId, true)}
          onReject={(id, userId) => handleApproveRequest(id, userId, false)}
          onClose={() => setShowPermissionRequests(false)}
        />
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        input[type="date"]::-webkit-calendar-picker-indicator,
        input[type="time"]::-webkit-calendar-picker-indicator {
          filter: invert(1);
          cursor: pointer;
        }
        select option {
          background-color: #1e293b;
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

// 设置 Modal 组件
const SettingsModal = ({ settings, onSave, onClose }) => {
  const [formData, setFormData] = useState(settings);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl shadow-2xl max-w-2xl w-full border border-white/20">
        <div className="bg-gradient-to-r from-purple-600 to-pink-500 px-8 py-6 flex items-center justify-between rounded-t-3xl">
          <h2 className="text-3xl font-bold text-white flex items-center">
            <Settings className="w-8 h-8 mr-3" />
            系统设置
          </h2>
          <button
            onClick={onClose}
            className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-all"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>
        
        <div className="p-8 space-y-6">
          <div>
            <label className="block text-gray-300 font-medium mb-2">公司中文名称</label>
            <input
              type="text"
              value={formData.company_name_cn}
              onChange={(e) => setFormData({...formData, company_name_cn: e.target.value})}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>

          <div>
            <label className="block text-gray-300 font-medium mb-2">公司英文名称</label>
            <input
              type="text"
              value={formData.company_name_en}
              onChange={(e) => setFormData({...formData, company_name_en: e.target.value})}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>

          <div>
            <label className="block text-gray-300 font-medium mb-2">Logo URL</label>
            <input
              type="text"
              value={formData.logo_url || ''}
              onChange={(e) => setFormData({...formData, logo_url: e.target.value})}
              placeholder="https://example.com/logo.png"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
            <p className="text-gray-400 text-sm mt-2">
              💡 提示：将Logo图片上传到图床（如imgbb.com），然后粘贴图片链接
            </p>
          </div>

          {formData.logo_url && (
            <div>
              <label className="block text-gray-300 font-medium mb-2">Logo 预览</label>
              <img 
                src={formData.logo_url} 
                alt="Logo Preview" 
                className="w-24 h-24 rounded-xl object-cover border-2 border-white/20"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
              <div className="hidden text-red-300 text-sm mt-2">⚠️ 图片加载失败，请检查URL</div>
            </div>
          )}

          <div className="flex justify-end space-x-4 pt-4 border-t border-white/10">
            <button
              onClick={onClose}
              className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold transition-all"
            >
              取消
            </button>
            <button
              onClick={() => onSave(formData)}
              className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl font-semibold transition-all shadow-lg"
            >
              保存设置
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// 权限申请 Modal 组件
const PermissionRequestsModal = ({ requests, onApprove, onReject, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden border border-white/20">
        <div className="bg-gradient-to-r from-amber-600 to-orange-500 px-8 py-6 flex items-center justify-between">
          <h2 className="text-3xl font-bold text-white flex items-center">
            <Shield className="w-8 h-8 mr-3" />
            权限申请管理
          </h2>
          <button
            onClick={onClose}
            className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-all"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>
        
        <div className="p-8 overflow-y-auto max-h-[calc(80vh-120px)]">
          {requests.length === 0 ? (
            <div className="text-center py-16">
              <Shield className="w-20 h-20 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400 text-xl">暂无待处理的权限申请</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map(request => (
                <div key={request.id} className="bg-white/5 rounded-xl p-6 border border-white/10">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-white font-bold text-lg">{request.username}</h3>
                      <p className="text-gray-400 text-sm mt-1">
                        申请成为：<span className="text-amber-400 font-semibold">管理员</span>
                      </p>
                      <p className="text-gray-400 text-sm mt-1">
                        申请时间：{new Date(request.requested_at).toLocaleString('zh-CN')}
                      </p>
                    </div>
                  </div>
                  
                  {request.reason && (
                    <div className="bg-white/5 rounded-lg p-4 mb-4">
                      <p className="text-gray-300 text-sm font-medium mb-2">申请理由：</p>
                      <p className="text-white">{request.reason}</p>
                    </div>
                  )}
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={() => onApprove(request.id, request.user_id)}
                      className="flex-1 bg-green-500/20 hover:bg-green-500/30 text-green-300 py-3 rounded-xl font-semibold flex items-center justify-center space-x-2 transition-all border border-green-400/30"
                    >
                      <Check className="w-5 h-5" />
                      <span>批准</span>
                    </button>
                    <button
                      onClick={() => onReject(request.id, request.user_id)}
                      className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 py-3 rounded-xl font-semibold flex items-center justify-center space-x-2 transition-all border border-red-400/30"
                    >
                      <XCircle className="w-5 h-5" />
                      <span>拒绝</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EastMountTravelSystem;
