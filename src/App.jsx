import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Search, Download, Edit2, Trash2, Car, Users, Briefcase, MapPin, Phone, Clock, X, LogOut, Eye, EyeOff, Shield, User, Settings, UserPlus, Check, XCircle, DollarSign, ChevronLeft, ChevronRight, Route, AlertCircle, CheckCircle, Ban, MessageSquare, Menu } from 'lucide-react';
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
  
  // 权限检查：是否可以查看金额信息
  const canViewFinance = currentUser?.role === 'admin' || currentUser?.role === 'manager';
  
  const [bookings, setBookings] = useState([]);
  const [activeView, setActiveView] = useState('list');
  const [calendarView, setCalendarView] = useState('schedule');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showPermissionRequests, setShowPermissionRequests] = useState(false);
  const [showPendingUsers, setShowPendingUsers] = useState(false);
  const [showAfterSalesModal, setShowAfterSalesModal] = useState(false);
  const [currentAfterSalesBooking, setCurrentAfterSalesBooking] = useState(null);
  const [afterSalesNotes, setAfterSalesNotes] = useState('');
  const [showFinanceReport, setShowFinanceReport] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    showCurrentPassword: false,
    showNewPassword: false
  });
  const [systemSettings, setSystemSettings] = useState({
    company_name_cn: '东山国际旅游',
    company_name_en: 'East Mount Luxury Travel',
    logo_url: ''
  });
  const [permissionRequests, setPermissionRequests] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showDayBookings, setShowDayBookings] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [viewingImage, setViewingImage] = useState(null); // 查看大图
  const [rememberUsername, setRememberUsername] = useState(false); // 记住用户名（仅用户名，不记住密码）
  const [filterAssignedTo, setFilterAssignedTo] = useState(''); // 按负责人过滤
  const [filterSource, setFilterSource] = useState(''); // 按订单来源过滤
  const [sortOrder, setSortOrder] = useState('date_desc'); // 排序：date_desc新到旧, date_asc旧到新
  const [allActiveUsers, setAllActiveUsers] = useState([]); // 所有活跃用户（用于分配下拉框）
  
  const [formData, setFormData] = useState({
    serviceType: '接机',
    date: '',
    endDate: '',
    time: '',
    endTime: '',
    pickup: '',
    dropoff: '',
    passengers: '',
    childCount: '',
    luggage: '',
    luggageSize: '28寸',
    customerName: '',
    customerPhone: '',
    flightNumber: '',  // 航班号（可选）
    notes: '',
    itinerary: '',
    deposit: '',
    balance: '',
    status: '待服务',
    paymentStatus: '未结算',  // 结算状态（独立于服务状态）
    source: '',
    assignedTo: '',
    vehicle: '',  // 车辆分配
    images: []  // 订单图片数组
  });

  // 订单状态配置（服务状态）
  const statusConfig = {
    '待服务': { label: '待服务', color: 'bg-amber-500/20 text-amber-300 border-amber-400/30', icon: AlertCircle },
    '已完成': { label: '已完成', color: 'bg-green-500/20 text-green-300 border-green-400/30', icon: CheckCircle },
    '已取消': { label: '已取消', color: 'bg-red-500/20 text-red-300 border-red-400/30', icon: Ban }
  };

  // 结算状态配置
  const paymentStatusConfig = {
    '未结算': { label: '未结算', color: 'bg-blue-500/20 text-blue-300 border-blue-400/30', icon: DollarSign },
    '已结算': { label: '已结算', color: 'bg-purple-500/20 text-purple-300 border-purple-400/30', icon: CheckCircle }
  };

  // 根据订单状态和结算状态获取背景色
  const getBookingBgColor = (status, paymentStatus) => {
    // 已取消订单 - 灰色（不考虑结算状态）
    if (status === '已取消') {
      return 'bg-gray-500/10 border-gray-400/20';
    }
    
    // 已完成 + 已结算 - 绿色（完全完成）
    if (status === '已完成' && paymentStatus === '已结算') {
      return 'bg-green-500/10 border-green-400/20';
    }
    
    // 待服务 + 未结算 - 红色（需要处理，未收款）
    if (status === '待服务' && paymentStatus === '未结算') {
      return 'bg-red-500/10 border-red-400/20';
    }
    
    // 其他情况（待服务+已结算 或 已完成+未结算）- 黄色
    return 'bg-yellow-500/10 border-yellow-400/20';
  };

  // 💾 页面加载时恢复登录状态
  React.useEffect(() => {
    const restoreLoginState = () => {
      try {
        const savedIsLoggedIn = localStorage.getItem('isLoggedIn');
        const savedUserData = localStorage.getItem('currentUser');
        
        if (savedIsLoggedIn === 'true' && savedUserData) {
          const userData = JSON.parse(savedUserData);
          
          // 🔒 严格验证：确保role有效
          const validRoles = ['admin', 'manager', 'viewer', 'driver', 'partner'];
          if (!validRoles.includes(userData.role)) {
            console.warn('检测到无效的role，自动修正为viewer');
            userData.role = 'viewer';
          }
          
          // 检查登录时间，如果超过7天则需要重新登录
          const loginTime = userData.loginTime ? new Date(userData.loginTime) : new Date(0);
          const daysSinceLogin = (new Date() - loginTime) / (1000 * 60 * 60 * 24);
          
          if (daysSinceLogin > 7) {
            console.log('登录已过期（超过7天），请重新登录');
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('currentUser');
            return;
          }
          
          // 恢复登录状态
          setCurrentUser(userData);
          setIsLoggedIn(true);
          console.log('已恢复登录状态:', userData.username, '角色:', userData.role);
          
          // 自动加载数据
          if (supabase) {
            loadBookings();
            loadSystemSettings();
            if (userData.role === 'admin') {
              loadPermissionRequests();
              loadPendingUsers();
            }
            if (userData.role === 'admin' || userData.role === 'manager') {
              loadActiveUsers();
            }
          }
        }
        
        // 恢复记住的用户名
        const savedUsername = localStorage.getItem('savedUsername');
        if (savedUsername) {
          setLoginForm(prev => ({ ...prev, username: savedUsername }));
          setRememberUsername(true);
        }
      } catch (error) {
        console.error('恢复登录状态失败:', error);
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('currentUser');
      }
    };
    
    restoreLoginState();
  }, [supabase]);

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

  // 页面加载时自动填充用户名（不填充密码）
  useEffect(() => {
    const savedUsername = localStorage.getItem('savedUsername');
    
    if (savedUsername) {
      // 只填充用户名，密码留空
      setLoginForm({ 
        username: savedUsername, 
        password: '', 
        showPassword: false 
      });
      setRememberUsername(true);
    }
    
    // 清除旧版本可能保存的密码和自动登录设置
    localStorage.removeItem('savedPassword');
    localStorage.removeItem('autoLogin');
  }, []);

  // 加载数据
  useEffect(() => {
    if (isLoggedIn && supabase) {
      loadBookings();
      loadSystemSettings();
      if (currentUser?.role === 'admin') {
        loadPermissionRequests();
        loadPendingUsers();
      }
      // admin和manager可以分配订单，需要加载用户列表
      if (currentUser?.role === 'admin' || currentUser?.role === 'manager') {
        loadActiveUsers();
      }
      
      // 实时订阅
      const channel = supabase
        .channel('all-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => loadBookings())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'system_settings' }, () => loadSystemSettings())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'permission_requests' }, () => loadPermissionRequests())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => loadPendingUsers())
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
      let query = supabase.from('bookings').select('*');

      // partner角色只能看到自己公司来源的订单（数据库层面过滤）
      if (currentUser?.role === 'partner' && currentUser?.source_filter) {
        query = query.eq('source', currentUser.source_filter);
      }

      const { data, error } = await query
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

  const loadPendingUsers = async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPendingUsers(data || []);
    } catch (error) {
      console.error('加载待审核用户失败:', error);
    }
  };

  // 加载所有活跃用户（用于订单分配下拉框）
  const loadActiveUsers = async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, username, display_name, role')
        .eq('status', 'active')
        .order('display_name', { ascending: true });

      if (error) throw error;
      setAllActiveUsers(data || []);
    } catch (error) {
      console.error('加载用户列表失败:', error);
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
        .single();

      if (error || !data) {
        alert('用户名或密码错误');
        return;
      }

      if (data.status === 'pending') {
        alert('您的账号正在审核中，请等待管理员批准');
        return;
      }

      if (data.status === 'rejected') {
        alert('您的账号申请已被拒绝，请联系管理员');
        return;
      }

      if (data.status !== 'active') {
        alert('您的账号状态异常，请联系管理员');
        return;
      }

      // 🔒 严格验证：确保只有admin和manager可以看到金额
      // 如果role不是这三个之一，强制设置为viewer
      const validRoles = ['admin', 'manager', 'viewer', 'driver', 'partner'];
      if (!validRoles.includes(data.role)) {
        console.warn('检测到无效的role，自动修正为viewer');
        data.role = 'viewer';
        // 同时更新数据库
        await supabase
          .from('users')
          .update({ role: 'viewer' })
          .eq('id', data.id);
      }

      // 保存用户名（不保存密码）
      if (rememberUsername) {
        localStorage.setItem('savedUsername', loginForm.username);
      } else {
        localStorage.removeItem('savedUsername');
      }
      
      // 确保清除旧版本可能保存的密码
      localStorage.removeItem('savedPassword');
      localStorage.removeItem('autoLogin');

      // 💾 保持登录状态：保存用户信息到localStorage
      const userDataToSave = {
        id: data.id,
        username: data.username,
        display_name: data.display_name,
        role: data.role,
        status: data.status,
        source_filter: data.source_filter || null, // 合作方来源过滤
        created_at: data.created_at,
        loginTime: new Date().toISOString()
      };
      localStorage.setItem('currentUser', JSON.stringify(userDataToSave));
      localStorage.setItem('isLoggedIn', 'true');

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
      const { data: existing } = await supabase
        .from('users')
        .select('username')
        .eq('username', registerForm.username)
        .single();

      if (existing) {
        alert('用户名已存在');
        return;
      }

      const { error } = await supabase
        .from('users')
        .insert([{
          username: registerForm.username,
          password: registerForm.password,
          display_name: registerForm.displayName,
          role: 'viewer',
          status: 'pending'
        }]);

      if (error) throw error;

      alert('注册成功！请等待管理员审核后即可登录');
      setShowRegister(false);
      setRegisterForm({ username: '', password: '', confirmPassword: '', displayName: '', showPassword: false });
    } catch (error) {
      console.error('注册失败:', error);
      alert('注册失败: ' + error.message);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!supabase || !currentUser) {
      alert('未登录或数据库未配置');
      return;
    }

    // 验证原密码
    if (!passwordForm.currentPassword) {
      alert('请输入当前密码');
      return;
    }

    // 验证新密码
    if (!passwordForm.newPassword) {
      alert('请输入新密码');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      alert('新密码长度至少6位');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('两次输入的新密码不一致');
      return;
    }

    if (passwordForm.currentPassword === passwordForm.newPassword) {
      alert('新密码不能与当前密码相同');
      return;
    }

    try {
      // 验证原密码
      const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      if (!user || user.password !== passwordForm.currentPassword) {
        alert('当前密码错误');
        return;
      }

      // 更新密码
      const { error } = await supabase
        .from('users')
        .update({ 
          password: passwordForm.newPassword,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentUser.id);

      if (error) throw error;

      alert('密码修改成功！');
      setShowChangePassword(false);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        showCurrentPassword: false,
        showNewPassword: false
      });
    } catch (error) {
      console.error('修改密码失败:', error);
      alert('修改密码失败: ' + error.message);
    }
  };

  const handleApproveUser = async (userId, approve) => {
    if (!supabase) return;

    try {
      const { error } = await supabase
        .from('users')
        .update({
          status: approve ? 'active' : 'rejected',
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;

      alert(approve ? '已批准用户注册' : '已拒绝用户注册');
      loadPendingUsers();
    } catch (error) {
      console.error('处理用户审核失败:', error);
      alert('处理失败: ' + error.message);
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
      const { error: requestError } = await supabase
        .from('permission_requests')
        .update({
          status: approve ? 'approved' : 'rejected',
          processed_at: new Date().toISOString(),
          processed_by: currentUser.display_name
        })
        .eq('id', requestId);

      if (requestError) throw requestError;

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

  const handleUpdateStatus = async (bookingId, newStatus) => {
    if (!supabase || currentUser.role !== 'admin') return;

    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          status: newStatus,
          updated_by: currentUser.display_name,
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId);

      if (error) throw error;
      await loadBookings();
      alert('状态更新成功！');
    } catch (error) {
      console.error('更新状态失败:', error);
      alert('更新状态失败: ' + error.message);
    }
  };

  // 更新结算状态
  const handleUpdatePaymentStatus = async (bookingId, newPaymentStatus) => {
    if (!supabase || currentUser.role !== 'admin') return;

    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          payment_status: newPaymentStatus,
          updated_by: currentUser.display_name,
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId);

      if (error) throw error;
      await loadBookings();
      alert('结算状态更新成功！');
    } catch (error) {
      console.error('更新结算状态失败:', error);
      alert('更新结算状态失败: ' + error.message);
    }
  };

  const handleAfterSales = async () => {
    if (!supabase || !currentAfterSalesBooking) return;

    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          after_sales_notes: afterSalesNotes,
          updated_by: currentUser.display_name,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentAfterSalesBooking.id);

      if (error) throw error;
      
      await loadBookings();
      setShowAfterSalesModal(false);
      setCurrentAfterSalesBooking(null);
      setAfterSalesNotes('');
      alert('售后备注已保存！');
    } catch (error) {
      console.error('保存售后备注失败:', error);
      alert('保存失败: ' + error.message);
    }
  };

  // 上传图片到Supabase Storage
  const uploadImage = async (file, folder = 'booking-images') => {
    if (!supabase) {
      alert('未配置Supabase，无法上传图片');
      return null;
    }

    try {
      // 生成唯一文件名
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      // 上传文件
      const { data, error } = await supabase.storage
        .from('images')  // bucket名称
        .upload(filePath, file);

      if (error) throw error;

      // 获取公共URL
      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('上传图片失败:', error);
      throw error;
    }
  };

  // 处理订单图片上传
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadingImage(true);
    try {
      const uploadPromises = files.map(file => uploadImage(file, 'booking-images'));
      const urls = await Promise.all(uploadPromises);
      
      // 添加到formData的images数组
      setFormData(prev => ({
        ...prev,
        images: [...(prev.images || []), ...urls]
      }));

      alert(`成功上传 ${files.length} 张图片`);
    } catch (error) {
      alert('上传图片失败: ' + error.message);
    } finally {
      setUploadingImage(false);
    }
  };

  // 删除订单图片
  const handleRemoveImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  // 处理Logo上传
  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      const url = await uploadImage(file, 'logos');
      
      // 保存到数据库
      if (supabase) {
        const { error } = await supabase
          .from('system_settings')
          .update({ logo_url: url })
          .eq('id', 1);

        if (error) throw error;
      }

      // 更新本地状态
      setSystemSettings(prev => ({ ...prev, logo_url: url }));
      alert('Logo上传成功！');
    } catch (error) {
      alert('上传Logo失败: ' + error.message);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (currentUser.role !== 'admin') {
      alert('您没有权限执行此操作');
      return;
    }

    if (!supabase) return;

    if (formData.serviceType === '包车') {
      if (!formData.endDate) {
        alert('包车服务请填写结束日期');
        return;
      }
      if (formData.endDate < formData.date) {
        alert('结束日期不能早于起始日期');
        return;
      }
    }

    try {
      setLoading(true);
      
      const bookingData = {
        service_type: formData.serviceType,
        date: formData.date,
        end_date: formData.serviceType === '包车' ? formData.endDate : null,
        time: formData.time,
        end_time: formData.serviceType === '包车' ? formData.endTime : null,
        pickup: formData.pickup,
        dropoff: formData.dropoff,
        passengers: formData.passengers,
        child_count: formData.childCount || null,
        luggage: formData.luggage,
        luggage_size: formData.luggageSize,
        customer_name: formData.customerName,
        customer_phone: formData.customerPhone,
        flight_number: formData.flightNumber || null,  // 航班号（可选）
        notes: formData.notes || null,
        itinerary: formData.serviceType === '包车' ? (formData.itinerary || null) : null,
        deposit: formData.deposit ? parseFloat(formData.deposit) : null,
        balance: formData.balance ? parseFloat(formData.balance) : null,
        status: formData.status || '待服务',
        payment_status: formData.paymentStatus || '未结算',  // 结算状态
        source: formData.source || null,
        assigned_to: formData.assignedTo || null,
        vehicle: formData.vehicle || null,  // 车辆分配
        images: formData.images || []  // 图片数组
      };
      
      if (editingBooking) {
        const { error } = await supabase
          .from('bookings')
          .update({
            ...bookingData,
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
            ...bookingData,
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
      endDate: '',
      time: '',
      endTime: '',
      pickup: '',
      dropoff: '',
      passengers: '',
      childCount: '',
      luggage: '',
      luggageSize: '28寸',
      customerName: '',
      customerPhone: '',
      flightNumber: '',
      notes: '',
      itinerary: '',
      deposit: '',
      balance: '',
      status: '待服务',
      paymentStatus: '未结算',
      source: '',
      assignedTo: '',
      vehicle: '',
      images: []
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
      endDate: booking.end_date || '',
      time: booking.time,
      endTime: booking.end_time || '',
      pickup: booking.pickup,
      dropoff: booking.dropoff,
      passengers: booking.passengers,
      childCount: booking.child_count || '',
      luggage: booking.luggage,
      luggageSize: booking.luggage_size,
      customerName: booking.customer_name,
      customerPhone: booking.customer_phone,
      flightNumber: booking.flight_number || '',
      notes: booking.notes || '',
      itinerary: booking.itinerary || '',
      deposit: booking.deposit || '',
      balance: booking.balance || '',
      status: booking.status || '待服务',
      paymentStatus: booking.payment_status || '未结算',
      source: booking.source || '',
      assignedTo: booking.assigned_to || '',
      vehicle: booking.vehicle || '',
      images: booking.images || []
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
    // 根据权限决定导出的列
    const headers = canViewFinance 
      ? ['服务类型', '起始日期', '结束日期', '起始时间', '结束时间', '上车地点', '下车地点', '乘客人数', '儿童人数', '行李数量', '行李尺寸', '客户姓名', '联系电话', '航班号', '定金', '尾款', '总价', '状态', '行程', '备注', '售后备注', '创建人', '创建时间']
      : ['服务类型', '起始日期', '结束日期', '起始时间', '结束时间', '上车地点', '下车地点', '乘客人数', '儿童人数', '行李数量', '行李尺寸', '客户姓名', '联系电话', '航班号', '状态', '行程', '备注', '售后备注', '创建人', '创建时间'];
    
    const rows = bookings.map(b => {
      const totalPrice = (parseFloat(b.deposit) || 0) + (parseFloat(b.balance) || 0);
      const statusLabel = statusConfig[b.status || '待服务']?.label || '待服务';
      
      // 根据权限决定导出的数据
      if (canViewFinance) {
        return [
          b.service_type, b.date, b.end_date || '', b.time, b.end_time || '', b.pickup, b.dropoff,
          b.passengers, b.child_count || '', b.luggage, b.luggage_size,
          b.customer_name, b.customer_phone, b.flight_number || '',
          b.deposit || '', b.balance || '', totalPrice.toFixed(2),
          statusLabel,
          b.itinerary || '', b.notes || '', b.after_sales_notes || '', b.created_by || '', 
          b.created_at ? new Date(b.created_at).toLocaleString('zh-CN') : ''
        ];
      } else {
        return [
          b.service_type, b.date, b.end_date || '', b.time, b.end_time || '', b.pickup, b.dropoff,
          b.passengers, b.child_count || '', b.luggage, b.luggage_size,
          b.customer_name, b.customer_phone, b.flight_number || '',
          statusLabel,
          b.itinerary || '', b.notes || '', b.after_sales_notes || '', b.created_by || '', 
          b.created_at ? new Date(b.created_at).toLocaleString('zh-CN') : ''
        ];
      }
    });
    
    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `东山国际旅游订单_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const calculateTotalPrice = (booking) => {
    const deposit = parseFloat(booking.deposit) || 0;
    const balance = parseFloat(booking.balance) || 0;
    
    // 如果订单已取消，只计算定金
    if (booking.status === '已取消') {
      return deposit;
    }
    
    // 其他状态计算定金+尾款
    return deposit + balance;
  };

  // 判断是否为高权限用户（可看全部订单）
  const isHighPrivilege = currentUser?.role === 'admin' || currentUser?.role === 'manager';

  // 所有订单来源（用于下拉筛选）
  const allSources = [...new Set(bookings.map(b => b.source).filter(Boolean))].sort();

  const filteredBookings = bookings.filter(booking => {
    // 低权限用户（viewer/driver）只能看分配给自己的订单
    if (!isHighPrivilege && currentUser?.role !== 'partner') {
      const myDisplayName = currentUser?.display_name;
      if (booking.assigned_to !== myDisplayName) return false;
      const matchesSearch = !searchTerm ||
        booking.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.customer_phone?.includes(searchTerm);
      const matchesDate = !filterDate || booking.date === filterDate;
      return matchesSearch && matchesDate;
    }
    // partner：数据库已过滤，只做搜索和日期过滤
    if (currentUser?.role === 'partner') {
      const matchesSearch = !searchTerm ||
        booking.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.customer_phone?.includes(searchTerm);
      const matchesDate = !filterDate || booking.date === filterDate;
      return matchesSearch && matchesDate;
    }
    // 高权限用户：全部过滤条件
    const matchesSearch =
      booking.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.customer_phone?.includes(searchTerm);
    const matchesDate = !filterDate || booking.date === filterDate;
    const matchesAssignedTo = !filterAssignedTo || booking.assigned_to === filterAssignedTo;
    const matchesSource = !filterSource || booking.source === filterSource;
    return matchesSearch && matchesDate && matchesAssignedTo && matchesSource;
  }).sort((a, b) => {
    // 排序：date_desc 新到旧，date_asc 旧到新
    const dateA = `${a.date || ''} ${a.time || ''}`;
    const dateB = `${b.date || ''} ${b.time || ''}`;
    if (sortOrder === 'date_asc') return dateA.localeCompare(dateB);
    return dateB.localeCompare(dateA); // date_desc 默认
  });

  const groupedByDate = filteredBookings.reduce((acc, booking) => {
    if (!acc[booking.date]) acc[booking.date] = [];
    acc[booking.date].push(booking);
    return acc;
  }, {});

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
    
    return filteredBookings.filter(b => {
      if (b.service_type === '包车' && b.end_date) {
        return dateStr >= b.date && dateStr <= b.end_date;
      } else {
        return b.date === dateStr;
      }
    });
  };

  // 登录页面继续...
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

              {/* 记住用户名 */}
              <div className="space-y-3">
                <label className="flex items-center space-x-3 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={rememberUsername}
                      onChange={(e) => setRememberUsername(e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                      rememberUsername 
                        ? 'bg-cyan-500 border-cyan-500' 
                        : 'bg-white/10 border-white/30 group-hover:border-cyan-400'
                    }`}>
                      {rememberUsername && <Check className="w-3.5 h-3.5 text-white" />}
                    </div>
                  </div>
                  <span className="text-gray-300 text-sm select-none">记住用户名</span>
                </label>

                <div className="bg-amber-500/10 border border-amber-400/20 rounded-lg p-3">
                  <p className="text-amber-300 text-xs leading-relaxed">
                    🔒 <span className="font-semibold">安全提示：</span>只记住用户名，密码需每次手动输入，确保账号安全
                  </p>
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

              <div className="mt-4 p-3 bg-amber-500/10 border border-amber-400/20 rounded-xl">
                <p className="text-amber-300 text-xs">💡 注册后需要等待管理员审核才能登录使用</p>
              </div>
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
                <p className="text-blue-300 text-xs">📝 注册后将由管理员审核，审核通过后即可登录查看订单信息</p>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  // 主界面继续...
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 overflow-x-hidden" style={{ fontFamily: "'Outfit', 'Noto Sans SC', sans-serif" }}>
      {/* Viewport meta tag for mobile */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Noto+Sans+SC:wght@300;400;500;700;900&display=swap" rel="stylesheet" />
      
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-500 shadow-2xl border-b-2 sm:border-b-4 border-amber-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 md:py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4">
              {systemSettings.logo_url ? (
                <img src={systemSettings.logo_url} alt="Logo" className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl object-cover border-2 border-white/30" />
              ) : (
                <div className="bg-white/20 backdrop-blur-sm p-2 sm:p-3 rounded-xl sm:rounded-2xl">
                  <Car className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-white" />
                </div>
              )}
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white tracking-tight whitespace-nowrap">{systemSettings.company_name_cn}</h1>
                <p className="text-blue-100 mt-0.5 sm:mt-1 text-xs sm:text-sm md:text-base lg:text-lg tracking-wide hidden sm:block">{systemSettings.company_name_en}</p>
              </div>
            </div>
            
            {/* 桌面端按钮 - 大屏幕显示 */}
            <div className="hidden lg:flex items-center space-x-3">
              {currentUser.role === 'admin' && (
                <>
                  <button
                    onClick={() => setShowSettings(true)}
                    className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-4 py-3 rounded-xl font-semibold flex items-center space-x-2 transition-all border border-white/30"
                  >
                    <Settings className="w-5 h-5" />
                    <span>设置</span>
                  </button>
                  {pendingUsers.length > 0 && (
                    <button
                      onClick={() => setShowPendingUsers(true)}
                      className="bg-green-500/20 hover:bg-green-500/30 backdrop-blur-sm text-green-200 px-4 py-3 rounded-xl font-semibold flex items-center space-x-2 transition-all border border-green-400/30 relative"
                    >
                      <UserPlus className="w-5 h-5" />
                      <span>用户审核</span>
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold">
                        {pendingUsers.length}
                      </span>
                    </button>
                  )}
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
                onClick={() => setShowChangePassword(true)}
                className="bg-cyan-500/20 hover:bg-cyan-500/30 backdrop-blur-sm text-cyan-200 px-6 py-3 rounded-xl font-semibold flex items-center space-x-2 transition-all border border-cyan-400/30"
              >
                <Settings className="w-5 h-5" />
                <span>修改密码</span>
              </button>
              <button
                onClick={() => {
                  // 清除登录状态
                  setIsLoggedIn(false);
                  setCurrentUser(null);
                  // 清除localStorage
                  localStorage.removeItem('isLoggedIn');
                  localStorage.removeItem('currentUser');
                  console.log('已退出登录');
                }}
                className="bg-red-500/20 hover:bg-red-500/30 backdrop-blur-sm text-white px-6 py-3 rounded-xl font-semibold flex items-center space-x-2 transition-all border border-red-400/30"
              >
                <LogOut className="w-5 h-5" />
                <span>退出</span>
              </button>
            </div>

            {/* 移动端汉堡菜单按钮 */}
            <button
              onClick={() => setShowMobileMenu(true)}
              className="lg:hidden bg-white/20 hover:bg-white/30 backdrop-blur-sm p-3 rounded-xl transition-all border border-white/30"
            >
              <Menu className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* 移动端菜单面板 */}
      {showMobileMenu && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 lg:hidden" onClick={() => setShowMobileMenu(false)}>
          <div className="fixed right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-gradient-to-br from-slate-800 to-slate-900 shadow-2xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* 菜单头部 */}
            <div className="bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-5 flex items-center justify-between border-b-2 border-amber-400">
              <h2 className="text-xl font-bold text-white">菜单</h2>
              <button
                onClick={() => setShowMobileMenu(false)}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-all"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* 用户信息 */}
            <div className="px-6 py-5 border-b border-white/10">
              <div className="flex items-center space-x-3">
                {currentUser.role === 'admin' ? (
                  <Shield className="w-8 h-8 text-amber-300" />
                ) : (
                  <User className="w-8 h-8 text-blue-300" />
                )}
                <div>
                  <p className="text-white font-semibold text-lg">{currentUser.display_name}</p>
                  <p className="text-blue-200 text-sm">{currentUser.role === 'admin' ? '管理员' : '查看者'}</p>
                </div>
              </div>
            </div>

            {/* 菜单项 */}
            <div className="px-4 py-4 space-y-2">
              {currentUser.role === 'admin' && (
                <>
                  <button
                    onClick={() => {
                      setShowSettings(true);
                      setShowMobileMenu(false);
                    }}
                    className="w-full bg-white/10 hover:bg-white/20 text-white px-5 py-4 rounded-xl font-medium flex items-center space-x-3 transition-all border border-white/20"
                  >
                    <Settings className="w-5 h-5" />
                    <span>系统设置</span>
                  </button>
                  
                  {pendingUsers.length > 0 && (
                    <button
                      onClick={() => {
                        setShowPendingUsers(true);
                        setShowMobileMenu(false);
                      }}
                      className="w-full bg-green-500/20 hover:bg-green-500/30 text-green-200 px-5 py-4 rounded-xl font-medium flex items-center justify-between transition-all border border-green-400/30"
                    >
                      <div className="flex items-center space-x-3">
                        <UserPlus className="w-5 h-5" />
                        <span>用户审核</span>
                      </div>
                      <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                        {pendingUsers.length}
                      </span>
                    </button>
                  )}
                  
                  {permissionRequests.length > 0 && (
                    <button
                      onClick={() => {
                        setShowPermissionRequests(true);
                        setShowMobileMenu(false);
                      }}
                      className="w-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 px-5 py-4 rounded-xl font-medium flex items-center justify-between transition-all border border-amber-400/30"
                    >
                      <div className="flex items-center space-x-3">
                        <Shield className="w-5 h-5" />
                        <span>权限申请</span>
                      </div>
                      <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                        {permissionRequests.length}
                      </span>
                    </button>
                  )}
                </>
              )}
              
              {currentUser.role === 'viewer' && (
                <button
                  onClick={() => {
                    handleRequestPermission();
                    setShowMobileMenu(false);
                  }}
                  className="w-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 px-5 py-4 rounded-xl font-medium flex items-center space-x-3 transition-all border border-amber-400/30"
                >
                  <Shield className="w-5 h-5" />
                  <span>申请管理员权限</span>
                </button>
              )}

              <button
                onClick={() => {
                  setShowChangePassword(true);
                  setShowMobileMenu(false);
                }}
                className="w-full bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 px-5 py-4 rounded-xl font-medium flex items-center space-x-3 transition-all border border-cyan-400/30"
              >
                <Settings className="w-5 h-5" />
                <span>修改密码</span>
              </button>

              <button
                onClick={() => {
                  // 清除登录状态
                  setIsLoggedIn(false);
                  setCurrentUser(null);
                  setShowMobileMenu(false);
                  // 清除localStorage
                  localStorage.removeItem('isLoggedIn');
                  localStorage.removeItem('currentUser');
                  console.log('已退出登录');
                }}
                className="w-full bg-red-500/20 hover:bg-red-500/30 text-white px-5 py-4 rounded-xl font-medium flex items-center space-x-3 transition-all border border-red-400/30"
              >
                <LogOut className="w-5 h-5" />
                <span>退出登录</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 主内容区域继续... */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 md:py-8">
        {/* Action Bar */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl sm:rounded-2xl shadow-2xl p-4 sm:p-6 mb-6 sm:mb-8 border border-white/20">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
            <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 w-full md:w-auto">
              <div className="flex space-x-2 min-w-max md:min-w-0">
                <button
                  onClick={() => setActiveView('list')}
                  className={`px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-medium transition-all whitespace-nowrap text-sm sm:text-base ${
                    activeView === 'list' 
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg' 
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  }`}
                >
                  {isHighPrivilege ? '订单列表' : '我的订单'}
                </button>
                <button
                  onClick={() => setActiveView('schedule')}
                  className={`px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-medium transition-all whitespace-nowrap text-sm sm:text-base ${
                    activeView === 'schedule' 
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg' 
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  }`}
                >
                  日程视图
                </button>
                <button
                  onClick={() => setActiveView('calendar')}
                  className={`px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-medium transition-all whitespace-nowrap text-sm sm:text-base ${
                    activeView === 'calendar' 
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg' 
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  }`}
                >
                  日历视图
                </button>
                
                {/* 按负责人过滤 - 仅高权限用户可见 */}
                {isHighPrivilege && (
                  <select
                    value={filterAssignedTo}
                    onChange={(e) => setFilterAssignedTo(e.target.value)}
                    className="px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-medium transition-all whitespace-nowrap text-sm sm:text-base bg-white/10 text-gray-300 hover:bg-white/20 border border-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-400 cursor-pointer"
                  >
                    <option value="" className="bg-slate-800 text-white">全部负责人</option>
                    {allActiveUsers.map(user => (
                      <option key={user.id} value={user.display_name} className="bg-slate-800 text-white">
                        {user.display_name}
                      </option>
                    ))}
                  </select>
                )}

                {/* 按来源筛选 - 仅高权限用户可见 */}
                {isHighPrivilege && (
                  <select
                    value={filterSource}
                    onChange={(e) => setFilterSource(e.target.value)}
                    className="px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-medium transition-all whitespace-nowrap text-sm sm:text-base bg-white/10 text-gray-300 hover:bg-white/20 border border-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-400 cursor-pointer"
                  >
                    <option value="" className="bg-slate-800 text-white">全部来源</option>
                    {allSources.map(src => (
                      <option key={src} value={src} className="bg-slate-800 text-white">{src}</option>
                    ))}
                  </select>
                )}

                {/* 排序按钮 */}
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-medium transition-all whitespace-nowrap text-sm sm:text-base bg-white/10 text-gray-300 hover:bg-white/20 border border-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-400 cursor-pointer"
                >
                  <option value="date_desc" className="bg-slate-800 text-white">⬇ 时间：新→旧</option>
                  <option value="date_asc" className="bg-slate-800 text-white">⬆ 时间：旧→新</option>
                </select>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 w-full md:w-auto">
              {currentUser.role === 'admin' && (
                <button
                  onClick={() => { setShowForm(true); setEditingBooking(null); resetForm(); }}
                  className="w-full sm:w-auto bg-amber-400 hover:bg-amber-500 text-blue-900 px-4 sm:px-6 py-3 rounded-xl font-semibold flex items-center justify-center space-x-2 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl text-sm sm:text-base"
                >
                  <Plus className="w-5 h-5" />
                  <span>新建订单</span>
                </button>
              )}
              {isHighPrivilege && (
                <button
                  onClick={handleExport}
                  disabled={bookings.length === 0}
                  className="w-full sm:w-auto bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-4 sm:px-6 py-3 rounded-xl font-semibold flex items-center justify-center space-x-2 transition-all disabled:opacity-50 text-sm sm:text-base"
                >
                  <Download className="w-5 h-5" />
                  <span>导出数据</span>
                </button>
              )}
            </div>
          </div>

          {/* 低权限用户提示条 */}
          {!isHighPrivilege && (
            <div className="mt-4 bg-cyan-500/10 border border-cyan-400/30 rounded-xl px-4 py-3 flex items-center space-x-2">
              <User className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              <span className="text-cyan-300 text-sm">
                {currentUser?.role === 'partner'
                  ? <>您好，<strong>{currentUser.display_name}</strong>！以下是来自贵公司的订单，共 <strong>{filteredBookings.length}</strong> 条。</>
                  : <>您好，<strong>{currentUser.display_name}</strong>！以下是分配给您的订单，共 <strong>{filteredBookings.length}</strong> 条。</>
                }
              </span>
            </div>
          )}
        </div>

        {/* Search and Filter */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl sm:rounded-2xl shadow-2xl p-4 sm:p-6 mb-6 sm:mb-8 border border-white/20">
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 w-full">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="搜索客户、电话..."
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
            {(searchTerm || filterDate || filterSource || filterAssignedTo) && (
              <button
                onClick={() => { setSearchTerm(''); setFilterDate(''); setFilterSource(''); setFilterAssignedTo(''); }}
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
                <p className="text-blue-100 text-sm font-medium">{isHighPrivilege ? '总订单数' : '我的订单数'}</p>
                <p className="text-4xl font-bold text-white mt-2">{isHighPrivilege ? bookings.length : filteredBookings.length}</p>
              </div>
              <Briefcase className="w-12 h-12 text-blue-200" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-2xl shadow-xl p-6 border border-cyan-400/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-cyan-100 text-sm font-medium">今日订单</p>
                <p className="text-4xl font-bold text-white mt-2">
                  {filteredBookings.filter(b => b.date === new Date().toISOString().split('T')[0]).length}
                </p>
              </div>
              <Calendar className="w-12 h-12 text-cyan-200" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl shadow-xl p-6 border border-amber-400/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-sm font-medium">{isHighPrivilege ? '总乘客数' : '我的乘客数'}</p>
                <p className="text-4xl font-bold text-white mt-2">
                  {filteredBookings.reduce((sum, b) => sum + (parseInt(b.passengers) || 0), 0)}
                </p>
              </div>
              <Users className="w-12 h-12 text-amber-200" />
            </div>
          </div>
          {isHighPrivilege ? (
            <button
              onClick={() => canViewFinance && setShowFinanceReport(true)}
              disabled={!canViewFinance}
              className={`bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-xl p-6 border border-green-400/30 w-full transition-all transform ${
                canViewFinance 
                  ? 'hover:from-green-600 hover:to-emerald-700 hover:scale-105 cursor-pointer' 
                  : 'opacity-50 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <p className="text-green-100 text-sm font-medium flex items-center">
                    总收入
                    <span className="ml-2 text-xs bg-white/20 px-2 py-0.5 rounded-full">点击查看明细</span>
                  </p>
                  <p className="text-4xl font-bold text-white mt-2">
                    {canViewFinance ? (
                      `¥${bookings.reduce((sum, b) => sum + calculateTotalPrice(b), 0).toFixed(2)}`
                    ) : (
                      <span className="text-2xl text-gray-400">权限不足</span>
                    )}
                  </p>
                </div>
                <DollarSign className="w-12 h-12 text-green-200" />
              </div>
            </button>
          ) : (
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-xl p-6 border border-purple-400/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">待完成订单</p>
                  <p className="text-4xl font-bold text-white mt-2">
                    {filteredBookings.filter(b => b.status === '待服务').length}
                  </p>
                </div>
                <Clock className="w-12 h-12 text-purple-200" />
              </div>
            </div>
          )}
        </div>

        {/* 订单列表/日程视图继续... */}
        {/* 主内容区域 - 三个独立视图 */}
        {loading && activeView === 'list' ? (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-xl p-16 text-center border border-white/20">
            <div className="animate-spin w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-400 text-xl">加载数据中...</p>
          </div>
        ) : (
          <>
            {/* 视图1: 订单列表 */}
            {activeView === 'list' && (
              <div className="space-y-4">
                {filteredBookings.length === 0 ? (
                  <div className="bg-white/5 backdrop-blur-md rounded-2xl shadow-xl p-16 text-center border border-white/10">
                    <Car className="w-20 h-20 text-gray-500 mx-auto mb-4" />
                    {isHighPrivilege ? (
                      <p className="text-gray-400 text-xl">暂无订单数据</p>
                    ) : (
                      <>
                        <p className="text-gray-300 text-xl font-semibold mb-2">暂无分配给您的订单</p>
                        <p className="text-gray-500 text-sm">订单由管理员分配，请联系管理员</p>
                      </>
                    )}
                  </div>
                ) : (
                  filteredBookings.map((booking) => {
                    const totalPrice = calculateTotalPrice(booking);
                    const StatusIcon = statusConfig[booking.status || '待服务'].icon;
                    const bgColor = getBookingBgColor(booking.status || '待服务', booking.payment_status || '未结算');
                    return (
                      <div key={booking.id} className={`${bgColor} backdrop-blur-md rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 transition-all border`}>
                        
                        {/* 移动端卡片布局 */}
                        <div className="block lg:hidden">
                          {/* 头部：服务类型 + 时间 + 状态 */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex flex-col space-y-2 flex-1">
                              <div className="flex items-center space-x-2">
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                  booking.service_type === '接机' 
                                    ? 'bg-green-500/20 text-green-300 border border-green-400/30'
                                    : booking.service_type === '送机'
                                    ? 'bg-orange-500/20 text-orange-300 border border-orange-400/30'
                                    : 'bg-purple-500/20 text-purple-300 border border-purple-400/30'
                                }`}>
                                  {booking.service_type}
                                </span>
                                <span className="text-white font-semibold text-sm">{booking.time}</span>
                              </div>
                              <div className="text-gray-300 text-xs">{booking.date}</div>
                            </div>
                            <span className={`px-2 py-1 rounded text-xs font-medium flex-shrink-0 ${statusConfig[booking.status || '待服务'].color}`}>
                              {statusConfig[booking.status || '待服务'].label}
                            </span>
                          </div>

                          {/* 客户信息 */}
                          <div className="space-y-2 mb-3">
                            <div className="flex items-center text-white text-sm">
                              <User className="w-4 h-4 mr-2 text-blue-400 flex-shrink-0" />
                              <span className="font-medium">{booking.customer_name}</span>
                              <Phone className="w-4 h-4 mx-2 text-cyan-400 flex-shrink-0" />
                              <a href={`tel:${booking.customer_phone}`} className="text-cyan-300">{booking.customer_phone}</a>
                            </div>
                            
                            <div className="flex items-start text-white text-sm">
                              <MapPin className="w-4 h-4 mr-2 text-green-400 mt-0.5 flex-shrink-0" />
                              <span className="flex-1">{booking.pickup} → {booking.dropoff}</span>
                            </div>

                            <div className="flex items-center text-gray-300 text-xs flex-wrap gap-3">
                              <span className="flex items-center">
                                <Users className="w-3 h-3 mr-1 text-blue-400" />
                                {booking.passengers}人
                                {booking.child_count && <span className="ml-1">({booking.child_count}儿童)</span>}
                              </span>
                              <span className="flex items-center">
                                <Briefcase className="w-3 h-3 mr-1 text-purple-400" />
                                {booking.luggage}件 ({booking.luggage_size})
                              </span>
                              {booking.flight_number && (
                                <span className="flex items-center">
                                  <span className="mr-1">✈️</span>
                                  {booking.flight_number}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* 订单信息 - 来源和负责人 */}
                          {(booking.source || booking.assigned_to || booking.vehicle) && (
                            <div className="flex flex-wrap gap-2 mb-3">
                              {booking.source && (
                                <span className="text-xs bg-blue-500/10 text-blue-300 px-2 py-1 rounded border border-blue-400/20 flex items-center">
                                  <span className="mr-1">📱</span>
                                  {booking.source}
                                </span>
                              )}
                              {booking.assigned_to && (
                                <span className="text-xs bg-green-500/10 text-green-300 px-2 py-1 rounded border border-green-400/20 flex items-center">
                                  <span className="mr-1">👨</span>
                                  {booking.assigned_to}
                                </span>
                              )}
                              {booking.vehicle && (
                                <span className="text-xs bg-purple-500/10 text-purple-300 px-2 py-1 rounded border border-purple-400/20 flex items-center">
                                  <span className="mr-1">🚗</span>
                                  {booking.vehicle}
                                </span>
                              )}
                            </div>
                          )}

                          {/* 备注和行程 */}
                          {booking.notes && (
                            <div className="mb-3 text-xs bg-amber-500/10 text-amber-300 px-3 py-2 rounded-lg border border-amber-400/20">
                              💬 {booking.notes}
                            </div>
                          )}
                          {booking.itinerary && (
                            <div className="mb-3 text-xs bg-purple-500/10 text-purple-300 px-3 py-2 rounded-lg border border-purple-400/20">
                              <Route className="w-3 h-3 inline mr-1" />
                              {booking.itinerary}
                            </div>
                          )}

                          {/* 订单图片 */}
                          {booking.images && booking.images.length > 0 && (
                            <div className="mb-3">
                              <div className="text-gray-400 text-xs mb-2 flex items-center">
                                <span className="mr-1">📷</span>
                                订单图片 ({booking.images.length}张) - 👆 点击查看大图
                              </div>
                              <div className="grid grid-cols-4 gap-2">
                                {booking.images.slice(0, 4).map((url, idx) => (
                                  <button
                                    key={idx}
                                    onClick={() => {
                                      console.log('图片点击:', url);
                                      setViewingImage(url);
                                    }}
                                    className="relative group focus:outline-none focus:ring-2 focus:ring-cyan-400 rounded-lg"
                                  >
                                    <img
                                      src={url}
                                      alt={`图片${idx + 1}`}
                                      className="w-full h-16 object-cover rounded-lg border border-white/20 cursor-pointer hover:border-cyan-400 hover:scale-105 transition-all shadow-lg"
                                    />
                                    {/* 查看提示 */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center rounded-lg pointer-events-none">
                                      <div className="text-center">
                                        <Eye className="w-5 h-5 text-white mx-auto mb-1" />
                                        <span className="text-white text-xs font-bold">查看</span>
                                      </div>
                                    </div>
                                    {/* 如果超过4张，显示更多提示 */}
                                    {idx === 3 && booking.images.length > 4 && (
                                      <div className="absolute inset-0 bg-black/70 flex items-center justify-center rounded-lg pointer-events-none">
                                        <span className="text-white text-xs font-bold">+{booking.images.length - 4}</span>
                                      </div>
                                    )}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* 价格信息 - 仅admin和manager可见 */}
                          {canViewFinance && (
                            <div className="flex items-center justify-between pt-3 border-t border-white/20">
                              <div className="flex items-center space-x-3 text-xs">
                                <span className="text-gray-300">
                                  定金: <span className="text-white font-semibold">¥{(parseFloat(booking.deposit) || 0).toFixed(2)}</span>
                                </span>
                                <span className="text-gray-300">
                                  尾款: <span className="text-white font-semibold">¥{(parseFloat(booking.balance) || 0).toFixed(2)}</span>
                                </span>
                              </div>
                              <div className="flex items-center">
                                <span className={`${(booking.payment_status || '未结算') === '已结算' ? 'text-green-400' : 'text-red-400'} text-sm mr-1`}>¥</span>
                                <span className={`${(booking.payment_status || '未结算') === '已结算' ? 'text-green-400' : 'text-red-400'} text-xl font-bold`}>{totalPrice.toFixed(2)}</span>
                              </div>
                            </div>
                          )}

                          {/* 操作按钮 */}
                          {currentUser.role === 'admin' && (
                            <div className="flex space-x-2 mt-3 pt-3 border-t border-white/20">
                              <button
                                onClick={() => handleEdit(booking)}
                                className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 py-2.5 rounded-lg transition-all text-sm font-medium flex items-center justify-center space-x-1"
                              >
                                <Edit2 className="w-4 h-4" />
                                <span>编辑</span>
                              </button>
                              <button
                                onClick={() => {
                                  setCurrentAfterSalesBooking(booking);
                                  setAfterSalesNotes(booking.after_sales_notes || '');
                                  setShowAfterSalesModal(true);
                                }}
                                className="flex-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 py-2.5 rounded-lg transition-all text-sm font-medium flex items-center justify-center space-x-1"
                              >
                                <MessageSquare className="w-4 h-4" />
                                <span>售后</span>
                              </button>
                              <button
                                onClick={() => handleDelete(booking.id)}
                                className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 py-2.5 rounded-lg transition-all text-sm font-medium flex items-center justify-center space-x-1"
                              >
                                <Trash2 className="w-4 h-4" />
                                <span>删除</span>
                              </button>
                            </div>
                          )}
                        </div>

                        {/* 桌面端6列布局 */}
                        <div className="hidden lg:block">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-6 gap-6">
                            <div>
                              <div className="flex items-center space-x-2 mb-3">
                                <span className={`px-4 py-1.5 rounded-full text-sm font-semibold ${
                                  booking.service_type === '接机' 
                                    ? 'bg-green-500/20 text-green-300 border border-green-400/30'
                                    : booking.service_type === '送机'
                                    ? 'bg-orange-500/20 text-orange-300 border border-orange-400/30'
                                    : 'bg-purple-500/20 text-purple-300 border border-purple-400/30'
                                }`}>
                                  {booking.service_type}
                                </span>
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center text-white">
                                  <Clock className="w-4 h-4 mr-2 text-cyan-400" />
                                  <span className="font-medium">
                                    {booking.date} {booking.time}
                                    {booking.end_date && (
                                      <span className="text-gray-400"> → {booking.end_date} {booking.end_time}</span>
                                    )}
                                  </span>
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
                                  <span>
                                    {booking.passengers}人
                                    {booking.child_count && ` (${booking.child_count}儿童)`}
                                  </span>
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
                                {booking.flight_number && (
                                  <div className="flex items-center text-blue-300">
                                    <span className="mr-2">✈️</span>
                                    <span className="font-mono">{booking.flight_number}</span>
                                  </div>
                                )}
                                {booking.notes && (
                                  <div className="mt-2 text-amber-300 text-sm bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-400/20">
                                    备注: {booking.notes}
                                  </div>
                                )}
                                {booking.itinerary && (
                                  <div className="mt-2 text-purple-300 text-sm bg-purple-500/10 px-3 py-1.5 rounded-lg border border-purple-400/20">
                                    <Route className="w-3 h-3 inline mr-1" />
                                    行程: {booking.itinerary}
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div>
                              <p className="text-gray-400 text-sm mb-2">订单信息</p>
                              <div className="space-y-2">
                                {booking.source && (
                                  <div className="bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-400/20">
                                    <span className="text-blue-300 text-sm">来源: {booking.source}</span>
                                  </div>
                                )}
                                {booking.assigned_to && (
                                  <div className="bg-green-500/10 px-3 py-1.5 rounded-lg border border-green-400/20">
                                    <span className="text-green-300 text-sm">负责: {booking.assigned_to}</span>
                                  </div>
                                )}
                                {booking.vehicle && (
                                  <div className="bg-purple-500/10 px-3 py-1.5 rounded-lg border border-purple-400/20">
                                    <span className="text-purple-300 text-sm">🚗 车辆: {booking.vehicle}</span>
                                  </div>
                                )}
                                {!booking.source && !booking.assigned_to && !booking.vehicle && (
                                  <div className="text-gray-500 text-sm">暂无</div>
                                )}
                                {/* 订单图片 */}
                                {booking.images && booking.images.length > 0 && (
                                  <div className="mt-2">
                                    <div className="text-gray-400 text-xs mb-1 flex items-center">
                                      📷 图片 ({booking.images.length}) - 👆 点击放大
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                      {booking.images.slice(0, 3).map((url, idx) => (
                                        <button
                                          key={idx}
                                          onClick={() => {
                                            console.log('桌面端图片点击:', url);
                                            setViewingImage(url);
                                          }}
                                          className="relative group focus:outline-none focus:ring-2 focus:ring-cyan-400 rounded"
                                        >
                                          <img
                                            src={url}
                                            alt={`图${idx + 1}`}
                                            className="w-12 h-12 object-cover rounded border border-white/20 cursor-pointer hover:border-cyan-400 hover:scale-110 transition-all shadow-md"
                                          />
                                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center rounded pointer-events-none">
                                            <Eye className="w-4 h-4 text-white" />
                                          </div>
                                        </button>
                                      ))}
                                      {booking.images.length > 3 && (
                                        <div className="w-12 h-12 bg-white/5 rounded border border-white/20 flex items-center justify-center">
                                          <span className="text-white text-xs font-bold">+{booking.images.length - 3}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* 价格信息 - 仅admin和manager可见 */}
                            {canViewFinance && (
                              <div>
                                <p className="text-gray-400 text-sm mb-2">价格</p>
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-gray-300 text-sm">定金:</span>
                                    <span className="text-white font-semibold">
                                      ¥{booking.deposit ? parseFloat(booking.deposit).toFixed(2) : '0.00'}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-gray-300 text-sm">尾款:</span>
                                    <span className="text-white font-semibold">
                                      ¥{booking.balance ? parseFloat(booking.balance).toFixed(2) : '0.00'}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between pt-2 border-t border-white/20">
                                    <span className="text-gray-300 text-sm font-medium">总价:</span>
                                    <div className="flex items-center">
                                      <DollarSign className={`w-5 h-5 ${(booking.payment_status || '未结算') === '已结算' ? 'text-green-400' : 'text-red-400'}`} />
                                      <span className={`text-3xl font-bold ${(booking.payment_status || '未结算') === '已结算' ? 'text-green-400' : 'text-red-400'}`}>
                                        {totalPrice.toFixed(2)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
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
                        {/* 桌面端布局结束 */}

                        {/* 状态管理区域 - 移动端和桌面端共用 */}
                        <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between border-t border-white/10 pt-4 space-y-3 sm:space-y-0">
                          <div className="flex items-center space-x-2 flex-wrap gap-2">
                            {/* 服务状态 */}
                            <div className="flex items-center space-x-2">
                              <StatusIcon className="w-5 h-5" />
                              <span className={`px-3 py-1 rounded-lg font-medium ${statusConfig[booking.status || '待服务'].color}`}>
                                {statusConfig[booking.status || '待服务'].label}
                              </span>
                            </div>
                            {/* 结算状态 */}
                            <div className="flex items-center space-x-2">
                              <DollarSign className="w-4 h-4 text-blue-400" />
                              <span className={`px-3 py-1 rounded-lg font-medium text-xs ${paymentStatusConfig[booking.payment_status || '未结算'].color}`}>
                                {paymentStatusConfig[booking.payment_status || '未结算'].label}
                              </span>
                            </div>
                          </div>

                          {currentUser.role === 'admin' && (
                            <div className="flex flex-col sm:flex-row gap-2">
                              {/* 服务状态按钮 */}
                              <div className="flex items-center space-x-2 flex-wrap gap-2">
                                <button
                                  onClick={() => handleUpdateStatus(booking.id, '待服务')}
                                  disabled={booking.status === '待服务'}
                                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                                    booking.status === '待服务'
                                      ? 'bg-amber-500/30 text-amber-200 cursor-not-allowed'
                                      : 'bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-400/30'
                                  }`}
                                >
                                  待服务
                                </button>
                                
                                <button
                                  onClick={() => handleUpdateStatus(booking.id, '已完成')}
                                  disabled={booking.status === '已完成'}
                                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                                    booking.status === '已完成'
                                      ? 'bg-green-500/30 text-green-200 cursor-not-allowed'
                                      : 'bg-green-500/10 text-green-300 hover:bg-green-500/20 border border-green-400/30'
                                  }`}
                                >
                                  已完成
                                </button>
                                
                                <button
                                  onClick={() => handleUpdateStatus(booking.id, '已取消')}
                                  disabled={booking.status === '已取消'}
                                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                                    booking.status === '已取消'
                                      ? 'bg-red-500/30 text-red-200 cursor-not-allowed'
                                      : 'bg-red-500/10 text-red-300 hover:bg-red-500/20 border border-red-400/30'
                                  }`}
                                >
                                  已取消
                                </button>
                              </div>
                              
                              {/* 结算状态按钮 - 始终显示（独立于服务状态）*/}
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => {
                                    const currentPaymentStatus = booking.payment_status || '未结算';
                                    const newPaymentStatus = currentPaymentStatus === '未结算' ? '已结算' : '未结算';
                                    handleUpdatePaymentStatus(booking.id, newPaymentStatus);
                                  }}
                                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                                    (booking.payment_status || '未结算') === '已结算'
                                      ? 'bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 border border-purple-400/30'
                                      : 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border border-blue-400/30'
                                  }`}
                                >
                                  {(booking.payment_status || '未结算') === '已结算' ? '✓ 已结算' : '标记已结算'}
                                </button>
                              </div>
                              
                              {booking.status === '已取消' && (
                                <button
                                  onClick={() => {
                                    setCurrentAfterSalesBooking(booking);
                                    setAfterSalesNotes(booking.after_sales_notes || '');
                                    setShowAfterSalesModal(true);
                                  }}
                                  className="px-3 py-1 rounded-lg text-sm font-medium bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 border border-purple-400/30 transition-all flex items-center space-x-1"
                                >
                                  <MessageSquare className="w-4 h-4" />
                                  <span>售后/退款</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        {/* 售后备注显示 */}
                        {booking.after_sales_notes && (
                          <div className="mt-3 p-3 bg-purple-500/10 border border-purple-400/30 rounded-lg">
                            <div className="flex items-start space-x-2">
                              <MessageSquare className="w-4 h-4 text-purple-300 mt-0.5 flex-shrink-0" />
                              <div className="flex-1">
                                <p className="text-purple-300 text-sm font-medium mb-1">售后说明：</p>
                                <p className="text-white text-sm whitespace-pre-wrap">{booking.after_sales_notes}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* 视图2: 日程视图 */}
            {activeView === 'schedule' && (
              <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-xl p-8 border border-white/20">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white flex items-center">
                    <Calendar className="w-6 h-6 mr-3 text-cyan-400" />
                    日程安排
                  </h2>
                </div>

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
                          {groupedByDate[date].map(booking => {
                            const totalPrice = calculateTotalPrice(booking);
                            const StatusIcon = statusConfig[booking.status || '待服务'].icon;
                            const bgColor = getBookingBgColor(booking.status || '待服务', booking.payment_status || '未结算');
                            return (
                              <div key={booking.id} className={`${bgColor} rounded-xl p-5 border-l-4 border-cyan-400 transition-all`}>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-6 flex-1">
                                    <div className="text-center">
                                      <div className="text-2xl font-bold text-white">{booking.time}</div>
                                      {booking.end_time && (
                                        <div className="text-sm text-gray-400">→ {booking.end_time}</div>
                                      )}
                                      {booking.service_type === '包车' && booking.end_date && (
                                        <div className="text-xs text-purple-300 mt-1 bg-purple-500/20 px-2 py-0.5 rounded">
                                          至 {booking.end_date}
                                        </div>
                                      )}
                                      <div className={`text-sm font-medium mt-1 ${
                                        booking.service_type === '接机' ? 'text-green-400' : 
                                        booking.service_type === '送机' ? 'text-orange-400' : 'text-purple-400'
                                      }`}>
                                        {booking.service_type}
                                      </div>
                                    </div>
                                    <div className="h-12 w-px bg-white/20"></div>
                                    <div className="flex-1">
                                      <div className="text-white font-semibold text-lg">
                                        {booking.pickup} → {booking.dropoff}
                                      </div>
                                      <div className="flex items-center space-x-4 mt-2 text-sm flex-wrap">
                                        <span className="text-blue-300">{booking.customer_name}</span>
                                        <span className="text-gray-400">•</span>
                                        <span className="text-gray-400">{booking.passengers}人</span>
                                        {booking.child_count && (
                                          <>
                                            <span className="text-gray-400">•</span>
                                            <span className="text-gray-400">{booking.child_count}儿童</span>
                                          </>
                                        )}
                                        <span className="text-gray-400">•</span>
                                        <span className="text-gray-400">{booking.luggage}件行李</span>
                                        {totalPrice > 0 && (
                                          <>
                                            <span className="text-gray-400">•</span>
                                            <span className={`${(booking.payment_status || '未结算') === '已结算' ? 'text-green-400' : 'text-red-400'} font-semibold`}>¥{totalPrice.toFixed(2)}</span>
                                          </>
                                        )}
                                        <span className="text-gray-400">•</span>
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusConfig[booking.status || '待服务'].color}`}>
                                          {statusConfig[booking.status || '待服务'].label}
                                        </span>
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
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 视图3: 日历视图 */}
            {activeView === 'calendar' && (
              <div className="bg-white/10 backdrop-blur-md rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 border border-white/20">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <button
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all"
                  >
                    <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </button>
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white">
                    {currentMonth.getFullYear()}年 {currentMonth.getMonth() + 1}月
                  </h3>
                  <button
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all"
                  >
                    <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </button>
                </div>
                
                <div className="grid grid-cols-7 gap-1 sm:gap-2">
                  {['日', '一', '二', '三', '四', '五', '六'].map(day => (
                    <div key={day} className="text-center text-gray-400 font-semibold py-2 sm:py-3 text-xs sm:text-sm">
                      {day}
                    </div>
                  ))}
                  {getDaysInMonth(currentMonth).map((day, index) => {
                    const dayBookings = getBookingsForDate(day).filter(b => b.status !== '已取消'); // 过滤已取消订单
                    const cancelledBookings = getBookingsForDate(day).filter(b => b.status === '已取消'); // 已取消订单
                    const isToday = day && 
                      currentMonth.getFullYear() === new Date().getFullYear() &&
                      currentMonth.getMonth() === new Date().getMonth() &&
                      day === new Date().getDate();
                    
                    return (
                      <div
                        key={index}
                        className={`min-h-[60px] sm:min-h-[100px] md:min-h-[120px] p-1 sm:p-2 rounded-lg border transition-all ${
                          day
                            ? dayBookings.length > 0 || cancelledBookings.length > 0
                              ? 'bg-cyan-500/20 border-cyan-400/50 hover:bg-cyan-500/30 cursor-pointer'
                              : 'bg-white/5 border-white/10'
                            : 'bg-transparent border-transparent'
                        } ${isToday ? 'ring-2 ring-amber-400' : ''}`}
                        onClick={(e) => {
                          // 移动端和桌面端都可以点击打开详情
                          if (day && (dayBookings.length > 0 || cancelledBookings.length > 0)) {
                            const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                            setSelectedDate(dateStr);
                            setShowDayBookings(true);
                          }
                        }}
                      >
                        {day && (
                          <>
                            <div className={`text-xs sm:text-sm font-semibold mb-1 ${
                              isToday ? 'text-amber-400' : 'text-white'
                            }`}>
                              {day}
                            </div>
                            
                            {/* 桌面端：显示订单详情 */}
                            <div className="hidden sm:block">
                            {/* 正常订单 - 显示全部 */}
                            {dayBookings.length > 0 && (
                              <div className="space-y-1 max-h-[200px] overflow-y-auto">
                                {dayBookings.map(booking => {
                                  // 根据订单状态和结算状态获取背景色
                                  const paymentStatus = booking.payment_status || '未结算';
                                  const calendarBgColor = (() => {
                                    // 已取消 - 灰色（不考虑结算状态）
                                    if (booking.status === '已取消') {
                                      return 'bg-gray-500/30 text-gray-200 hover:bg-gray-500/50';
                                    }
                                    // 已完成 + 已结算 - 绿色
                                    if (booking.status === '已完成' && paymentStatus === '已结算') {
                                      return 'bg-green-500/30 text-green-200 hover:bg-green-500/50';
                                    }
                                    // 待服务 + 未结算 - 红色
                                    if (booking.status === '待服务' && paymentStatus === '未结算') {
                                      return 'bg-red-500/30 text-red-200 hover:bg-red-500/50';
                                    }
                                    // 其他情况（待服务+已结算 或 已完成+未结算）- 黄色
                                    return 'bg-yellow-500/30 text-yellow-200 hover:bg-yellow-500/50';
                                  })();
                                  
                                  return (
                                    <div
                                      key={booking.id}
                                      className={`text-xs ${calendarBgColor} px-2 py-1 rounded truncate cursor-pointer transition-all`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEdit(booking);
                                      }}
                                      title={canViewFinance 
                                        ? `${booking.time} ${booking.customer_name} - ¥${calculateTotalPrice(booking).toFixed(2)}`
                                        : `${booking.time} ${booking.customer_name}`
                                      }
                                    >
                                      {booking.time} {booking.customer_name}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                            {/* 已取消订单 - 显示全部 */}
                            {cancelledBookings.length > 0 && (
                              <div className="space-y-1 mt-1 max-h-[100px] overflow-y-auto">
                                {cancelledBookings.map(booking => (
                                  <div
                                    key={booking.id}
                                    className="text-xs bg-gray-500/30 text-gray-200 px-2 py-1 rounded truncate cursor-pointer hover:bg-gray-500/50 transition-all"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEdit(booking);
                                    }}
                                    title={`[已取消] ${booking.time} ${booking.customer_name}`}
                                  >
                                    [已取消] {booking.customer_name}
                                  </div>
                                ))}
                              </div>
                            )}
                            {/* 显示订单总数 */}
                            {(dayBookings.length + cancelledBookings.length > 0) && (
                              <div 
                                className="text-xs text-center mt-1 pt-1 border-t border-white/20 text-cyan-300 hover:text-cyan-100 cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                  setSelectedDate(dateStr);
                                  setShowDayBookings(true);
                                }}
                              >
                                共{dayBookings.length + cancelledBookings.length}单 · 详情
                              </div>
                            )}
                            </div>

                            {/* 移动端：只显示订单数量 */}
                            <div className="sm:hidden text-center">
                              {(dayBookings.length + cancelledBookings.length > 0) && (
                                <>
                                  <div className="text-xs font-bold text-cyan-300">
                                    {dayBookings.length + cancelledBookings.length}单
                                  </div>
                                  {cancelledBookings.length > 0 && (
                                    <div className="text-xs text-red-300 mt-0.5">
                                      {cancelledBookings.length}已取消
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* 订单表单 Modal */}
      {showForm && (
        <OrderFormModal
          formData={formData}
          setFormData={setFormData}
          editingBooking={editingBooking}
          loading={loading}
          onSubmit={handleSubmit}
          onClose={() => {
            setShowForm(false);
            setEditingBooking(null);
            resetForm();
          }}
          uploadingImage={uploadingImage}
          onImageUpload={handleImageUpload}
          onRemoveImage={handleRemoveImage}
          setViewingImage={setViewingImage}
          canViewFinance={canViewFinance}
          allActiveUsers={allActiveUsers}
        />
      )}

      {/* 售后/退款 Modal */}
      {showAfterSalesModal && currentAfterSalesBooking && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl shadow-2xl max-w-2xl w-full border border-white/20">
            <div className="bg-gradient-to-r from-purple-600 to-pink-500 px-8 py-6 flex items-center justify-between rounded-t-3xl">
              <h2 className="text-3xl font-bold text-white flex items-center">
                <MessageSquare className="w-8 h-8 mr-3" />
                售后/退款说明
              </h2>
              <button
                onClick={() => {
                  setShowAfterSalesModal(false);
                  setCurrentAfterSalesBooking(null);
                  setAfterSalesNotes('');
                }}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-all"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>
            
            <div className="p-8">
              <div className="mb-6 bg-white/5 rounded-xl p-4">
                <h3 className="text-white font-semibold mb-2">订单信息：</h3>
                <p className="text-gray-300">客户：{currentAfterSalesBooking.customer_name}</p>
                <p className="text-gray-300">日期：{currentAfterSalesBooking.date}</p>
                {canViewFinance && (
                  <p className="text-gray-300">总价：¥{calculateTotalPrice(currentAfterSalesBooking).toFixed(2)}</p>
                )}
              </div>

              <div>
                <label className="block text-gray-300 font-medium mb-2">售后/退款说明 *</label>
                <textarea
                  value={afterSalesNotes}
                  onChange={(e) => setAfterSalesNotes(e.target.value)}
                  placeholder="请输入售后处理说明、退款金额、退款方式等信息...&#10;例如：&#10;退款金额：$120.00（全额退款）&#10;退款方式：原路退回&#10;退款时间：2026-01-18&#10;原因：客户临时取消行程"
                  rows="8"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
                  required
                />
              </div>

              {currentAfterSalesBooking.after_sales_notes && (
                <div className="mt-4 bg-purple-500/10 border border-purple-400/30 rounded-xl p-4">
                  <p className="text-purple-300 text-sm font-medium mb-2">原有售后备注：</p>
                  <p className="text-white text-sm whitespace-pre-wrap">{currentAfterSalesBooking.after_sales_notes}</p>
                </div>
              )}

              <div className="flex justify-end space-x-4 mt-6">
                <button
                  onClick={() => {
                    setShowAfterSalesModal(false);
                    setCurrentAfterSalesBooking(null);
                    setAfterSalesNotes('');
                  }}
                  className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold transition-all"
                >
                  取消
                </button>
                <button
                  onClick={handleAfterSales}
                  disabled={!afterSalesNotes.trim()}
                  className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl font-semibold transition-all shadow-lg disabled:opacity-50"
                >
                  保存售后备注
                </button>
              </div>
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
          uploadingLogo={uploadingLogo}
          onLogoUpload={handleLogoUpload}
        />
      )}

      {/* 待审核用户 Modal */}
      {showPendingUsers && (
        <PendingUsersModal
          users={pendingUsers}
          onApprove={(userId) => handleApproveUser(userId, true)}
          onReject={(userId) => handleApproveUser(userId, false)}
          onClose={() => setShowPendingUsers(false)}
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

      {/* 财务报表 Modal */}
      {showFinanceReport && (
        <FinanceReportModal
          bookings={bookings}
          calculateTotalPrice={calculateTotalPrice}
          statusConfig={statusConfig}
          onClose={() => setShowFinanceReport(false)}
        />
      )}

      {/* 修改密码 Modal */}
      {showChangePassword && (
        <ChangePasswordModal
          passwordForm={passwordForm}
          setPasswordForm={setPasswordForm}
          onSubmit={handleChangePassword}
          onClose={() => {
            setShowChangePassword(false);
            setPasswordForm({
              currentPassword: '',
              newPassword: '',
              confirmPassword: '',
              showCurrentPassword: false,
              showNewPassword: false
            });
          }}
        />
      )}

      {/* 当天订单详情 Modal */}
      {showDayBookings && selectedDate && (
        <DayBookingsModal
          date={selectedDate}
          bookings={getBookingsForDate(parseInt(selectedDate.split('-')[2]))}
          calculateTotalPrice={calculateTotalPrice}
          statusConfig={statusConfig}
          onEdit={handleEdit}
          onClose={() => {
            setShowDayBookings(false);
            setSelectedDate(null);
          }}
        />
      )}

      <style>{`
        /* 全局防止横向滚动 */}
        * {
          box-sizing: border-box;
        }
        html, body {
          overflow-x: hidden;
          width: 100%;
          position: relative;
        }
        
        /* 防止文字垂直排列 */}
        h1, h2, h3, h4, h5, h6, p, span, div {
          writing-mode: horizontal-tb;
          text-orientation: mixed;
        }
        
        /* 确保所有容器不超出视口 */
        .max-w-7xl {
          max-width: 100%;
          padding-left: 1rem;
          padding-right: 1rem;
        }
        
        @media (min-width: 640px) {
          .max-w-7xl {
            max-width: 1280px;
            padding-left: 1.5rem;
            padding-right: 1.5rem;
          }
        }
        
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

      {/* 图片查看器 */}
      {viewingImage && (
        <ImageViewer 
          imageUrl={viewingImage} 
          onClose={() => setViewingImage(null)} 
        />
      )}
    </div>
  );
};

// 组件定义继续...
// 订单表单 Modal 组件
const OrderFormModal = ({ formData, setFormData, editingBooking, loading, onSubmit, onClose, uploadingImage, onImageUpload, onRemoveImage, setViewingImage, canViewFinance, allActiveUsers = [] }) => {
  const totalPrice = (parseFloat(formData.deposit) || 0) + (parseFloat(formData.balance) || 0);
  const isCharterService = formData.serviceType === '包车';

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-0 sm:p-4 z-50">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-none sm:rounded-3xl shadow-2xl max-w-4xl w-full h-full sm:h-auto sm:max-h-[90vh] overflow-hidden border-0 sm:border border-white/20 flex flex-col">
        <div className="bg-gradient-to-r from-blue-600 to-cyan-500 px-4 sm:px-6 md:px-8 py-4 sm:py-6 flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
            {editingBooking ? '编辑订单' : '新建订单'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-all"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </button>
        </div>
        
        <div className="overflow-y-auto flex-1 p-4 sm:p-6 md:p-8">
          <form onSubmit={onSubmit} className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-gray-300 font-medium mb-2 text-sm sm:text-base">服务类型 *</label>
                <select
                  value={formData.serviceType}
                  onChange={(e) => setFormData({...formData, serviceType: e.target.value})}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white text-base focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  required
                >
                  <option value="接机" className="bg-slate-800">接机</option>
                  <option value="送机" className="bg-slate-800">送机</option>
                  <option value="包车" className="bg-slate-800">包车</option>
                </select>
              </div>
              
              {/* 日期和时间字段 - 根据服务类型动态显示 */}
              {isCharterService ? (
                <>
                  <div>
                    <label className="block text-gray-300 font-medium mb-2">起始日期 *</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-300 font-medium mb-2">结束日期 *</label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-300 font-medium mb-2">起始时间 *</label>
                    <input
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData({...formData, time: e.target.value})}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-300 font-medium mb-2">结束时间 *</label>
                    <input
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                      required
                    />
                  </div>
                </>
              ) : (
                <>
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
                </>
              )}
              
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
                <label className="block text-gray-300 font-medium mb-2">儿童人数（可选）</label>
                <input
                  type="number"
                  value={formData.childCount}
                  onChange={(e) => setFormData({...formData, childCount: e.target.value})}
                  placeholder="例如: 2"
                  min="0"
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
                <label className="block text-gray-300 font-medium mb-2">航班号（可选）</label>
                <input
                  type="text"
                  value={formData.flightNumber}
                  onChange={(e) => setFormData({...formData, flightNumber: e.target.value})}
                  placeholder="例如: CZ3140、MU5122等"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
              </div>
              
              <div>
                <label className="block text-gray-300 font-medium mb-2">订单来源</label>
                <input
                  type="text"
                  value={formData.source}
                  onChange={(e) => setFormData({...formData, source: e.target.value})}
                  placeholder="例如: 微信、网站、电话、推荐等"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
              </div>
              
              <div>
                <label className="block text-gray-300 font-medium mb-2">订单分配人员</label>
                <select
                  value={formData.assignedTo}
                  onChange={(e) => setFormData({...formData, assignedTo: e.target.value})}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                >
                  <option value="" className="bg-slate-800 text-gray-400">-- 暂不分配 --</option>
                  {allActiveUsers.length > 0 ? (
                    allActiveUsers.map(user => (
                      <option key={user.id} value={user.display_name} className="bg-slate-800 text-white">
                        {user.display_name}（{user.role === 'admin' ? '管理员' : user.role === 'manager' ? '经理' : user.role === 'driver' ? '司机' : '普通用户'}）
                      </option>
                    ))
                  ) : (
                    <option disabled className="bg-slate-800 text-gray-400">加载中...</option>
                  )}
                </select>
                {formData.assignedTo && (
                  <p className="text-cyan-400 text-xs mt-1">
                    ✅ 已分配给：{formData.assignedTo}（该用户将在登录后看到此订单）
                  </p>
                )}
              </div>

              <div>
                <label className="block text-gray-300 font-medium mb-2">🚗 车辆分配</label>
                <input
                  type="text"
                  value={formData.vehicle}
                  onChange={(e) => setFormData({...formData, vehicle: e.target.value})}
                  placeholder="例如: 丰田阿尔法、奔驰V260、鲁A12345"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
              </div>
              
              {/* 定金尾款 - 仅admin和manager可见 */}
              {canViewFinance && (
                <>
                  <div>
                    <label className="block text-gray-300 font-medium mb-2">定金 (¥)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.deposit}
                      onChange={(e) => setFormData({...formData, deposit: e.target.value})}
                      placeholder="例如: 50.00"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-300 font-medium mb-2">尾款 (¥)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.balance}
                      onChange={(e) => setFormData({...formData, balance: e.target.value})}
                      placeholder="例如: 100.00"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    />
                  </div>
                </>
              )}
              
              {canViewFinance && (formData.deposit || formData.balance) && (
                <div className="md:col-span-2">
                  <div className={`${(formData.paymentStatus || '未结算') === '已结算' ? 'bg-green-500/20 border-green-400/30' : 'bg-red-500/20 border-red-400/30'} rounded-xl p-4`}>
                    <div className="flex items-center justify-between">
                      <span className={`${(formData.paymentStatus || '未结算') === '已结算' ? 'text-green-400' : 'text-red-400'} font-medium text-lg`}>总价：</span>
                      <span className={`text-3xl font-bold ${(formData.paymentStatus || '未结算') === '已结算' ? 'text-green-400' : 'text-red-400'}`}>¥{totalPrice.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
              
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

              {isCharterService && (
                <div className="md:col-span-2">
                  <label className="block text-gray-300 font-medium mb-2 flex items-center">
                    <Route className="w-4 h-4 mr-2 text-purple-400" />
                    行程（包车服务）
                  </label>
                  <textarea
                    value={formData.itinerary}
                    onChange={(e) => setFormData({...formData, itinerary: e.target.value})}
                    placeholder="例如: 上午游览市区景点，下午前往海滩，傍晚返回酒店"
                    rows="4"
                    className="w-full px-4 py-3 bg-purple-500/10 border border-purple-400/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
                  />
                </div>
              )}
            </div>
            
            {/* 图片上传区域 */}
            <div className="mt-6 p-4 sm:p-6 bg-white/5 rounded-xl border border-white/10">
              <label className="block text-gray-300 font-medium mb-3 text-sm sm:text-base">
                📷 订单图片（选填）
              </label>
              <p className="text-gray-400 text-xs sm:text-sm mb-4">
                可以上传订单相关图片，如行李照片、客户要求截图等
              </p>
              
              {/* 上传按钮 */}
              <div className="mb-4">
                <label className="inline-flex items-center px-4 py-3 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-xl cursor-pointer transition-all border border-blue-400/30 text-sm sm:text-base">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={onImageUpload}
                    disabled={uploadingImage}
                    className="hidden"
                  />
                  {uploadingImage ? (
                    <>
                      <div className="animate-spin w-5 h-5 border-2 border-blue-300 border-t-transparent rounded-full mr-2" />
                      <span>上传中...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5 mr-2" />
                      <span>选择图片</span>
                    </>
                  )}
                </label>
                <p className="text-gray-500 text-xs mt-2">
                  支持JPG、PNG格式，可一次选择多张
                </p>
              </div>

              {/* 图片预览 */}
              {formData.images && formData.images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {formData.images.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={url}
                        alt={`订单图片 ${index + 1}`}
                        onClick={() => setViewingImage(url)}
                        className="w-full h-24 sm:h-32 object-cover rounded-lg border border-white/20 cursor-pointer hover:border-cyan-400 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => onRemoveImage(index)}
                        className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      {/* 查看提示 */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center rounded-lg pointer-events-none">
                        <Eye className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {formData.images && formData.images.length === 0 && (
                <div className="text-center py-8 text-gray-500 text-sm">
                  暂无图片
                </div>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold transition-all border border-white/20 text-base"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-xl font-semibold transition-all shadow-lg disabled:opacity-50 text-base"
              >
                {loading ? '保存中...' : (editingBooking ? '保存修改' : '创建订单')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// 其他Modal组件继续...
// 设置 Modal 组件
const SettingsModal = ({ settings, onSave, onClose, uploadingLogo, onLogoUpload }) => {
  const [formData, setFormData] = useState(settings);

  // 当settings变化时更新formData（Logo上传成功后）
  useEffect(() => {
    setFormData(settings);
  }, [settings]);

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
            <label className="block text-gray-300 font-medium mb-2">公司Logo</label>
            <div className="space-y-4">
              {/* 上传按钮 */}
              <label className="inline-flex items-center px-6 py-3 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-xl cursor-pointer transition-all border border-purple-400/30">
                <input
                  type="file"
                  accept="image/*"
                  onChange={onLogoUpload}
                  disabled={uploadingLogo}
                  className="hidden"
                />
                {uploadingLogo ? (
                  <>
                    <div className="animate-spin w-5 h-5 border-2 border-purple-300 border-t-transparent rounded-full mr-2" />
                    <span>上传中...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5 mr-2" />
                    <span>选择Logo图片</span>
                  </>
                )}
              </label>
              <p className="text-gray-400 text-sm">
                💡 推荐尺寸：200x200像素，支持JPG、PNG格式
              </p>
            </div>
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
              <div className="hidden text-red-300 text-sm mt-2">⚠️ 图片加载失败</div>
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

// 待审核用户 Modal 组件
const PendingUsersModal = ({ users, onApprove, onReject, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden border border-white/20">
        <div className="bg-gradient-to-r from-green-600 to-emerald-500 px-8 py-6 flex items-center justify-between">
          <h2 className="text-3xl font-bold text-white flex items-center">
            <UserPlus className="w-8 h-8 mr-3" />
            用户注册审核
          </h2>
          <button
            onClick={onClose}
            className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-all"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>
        
        <div className="p-8 overflow-y-auto max-h-[calc(80vh-120px)]">
          {users.length === 0 ? (
            <div className="text-center py-16">
              <UserPlus className="w-20 h-20 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400 text-xl">暂无待审核的用户</p>
            </div>
          ) : (
            <div className="space-y-4">
              {users.map(user => (
                <div key={user.id} className="bg-white/5 rounded-xl p-6 border border-white/10">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-white font-bold text-lg">{user.display_name}</h3>
                      <p className="text-gray-400 text-sm mt-1">
                        用户名：<span className="text-cyan-400 font-mono">{user.username}</span>
                      </p>
                      <p className="text-gray-400 text-sm mt-1">
                        注册时间：{new Date(user.created_at).toLocaleString('zh-CN')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={() => onApprove(user.id)}
                      className="flex-1 bg-green-500/20 hover:bg-green-500/30 text-green-300 py-3 rounded-xl font-semibold flex items-center justify-center space-x-2 transition-all border border-green-400/30"
                    >
                      <Check className="w-5 h-5" />
                      <span>批准</span>
                    </button>
                    <button
                      onClick={() => onReject(user.id)}
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

// 财务报表 Modal 组件
const FinanceReportModal = ({ bookings, calculateTotalPrice, statusConfig, onClose }) => {
  // 按状态分类订单
  const ordersByStatus = {
    '待服务': bookings.filter(b => b.status === '待服务'),
    '已完成': bookings.filter(b => b.status === '已完成'),
    '已取消': bookings.filter(b => b.status === '已取消')
  };

  // 计算各状态收入
  const incomeByStatus = {
    '待服务': ordersByStatus['待服务'].reduce((sum, b) => sum + calculateTotalPrice(b), 0),
    '已完成': ordersByStatus['已完成'].reduce((sum, b) => sum + calculateTotalPrice(b), 0),
    '已取消': ordersByStatus['已取消'].reduce((sum, b) => sum + calculateTotalPrice(b), 0)
  };

  const totalIncome = Object.values(incomeByStatus).reduce((sum, income) => sum + income, 0);

  // 按月份分组
  const ordersByMonth = bookings.reduce((acc, booking) => {
    const month = booking.date.substring(0, 7); // YYYY-MM
    if (!acc[month]) acc[month] = [];
    acc[month].push(booking);
    return acc;
  }, {});

  // 导出财务报表
  const handleExportFinance = () => {
    const headers = ['日期', '客户姓名', '联系电话', '航班号', '服务类型', '状态', '定金', '尾款', '总价', '售后备注'];
    const rows = bookings.map(b => {
      const totalPrice = calculateTotalPrice(b);
      return [
        b.date,
        b.customer_name,
        b.customer_phone,
        b.flight_number || '',
        b.service_type,
        statusConfig[b.status || '待服务']?.label || '待服务',
        (parseFloat(b.deposit) || 0).toFixed(2),
        (parseFloat(b.balance) || 0).toFixed(2),
        totalPrice.toFixed(2),
        b.after_sales_notes || ''
      ];
    });
    
    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `财务报表_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden border border-white/20">
        <div className="bg-gradient-to-r from-green-600 to-emerald-500 px-8 py-6 flex items-center justify-between">
          <h2 className="text-3xl font-bold text-white flex items-center">
            <DollarSign className="w-8 h-8 mr-3" />
            财务报表
          </h2>
          <div className="flex items-center space-x-4">
            <button
              onClick={handleExportFinance}
              className="bg-white/20 hover:bg-white/30 px-6 py-2 rounded-xl font-semibold text-white flex items-center space-x-2 transition-all"
            >
              <Download className="w-5 h-5" />
              <span>导出报表</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-all"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>
        
        <div className="p-8 overflow-y-auto max-h-[calc(90vh-100px)]">
          {/* 总收入概览 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-xl p-6 border border-green-400/30">
              <h3 className="text-green-100 text-sm font-medium mb-2">总收入</h3>
              <p className="text-4xl font-bold text-white">¥{totalIncome.toFixed(2)}</p>
              <p className="text-green-200 text-sm mt-2">{bookings.length} 笔订单</p>
            </div>
            
            <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl shadow-xl p-6 border border-amber-400/30">
              <h3 className="text-amber-100 text-sm font-medium mb-2">待服务</h3>
              <p className="text-4xl font-bold text-white">¥{incomeByStatus['待服务'].toFixed(2)}</p>
              <p className="text-amber-200 text-sm mt-2">{ordersByStatus['待服务'].length} 笔订单</p>
            </div>
            
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-xl p-6 border border-green-400/30">
              <h3 className="text-green-100 text-sm font-medium mb-2">已完成</h3>
              <p className="text-4xl font-bold text-white">¥{incomeByStatus['已完成'].toFixed(2)}</p>
              <p className="text-green-200 text-sm mt-2">{ordersByStatus['已完成'].length} 笔订单</p>
            </div>
            
            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl shadow-xl p-6 border border-red-400/30">
              <h3 className="text-red-100 text-sm font-medium mb-2">已取消</h3>
              <p className="text-4xl font-bold text-white">¥{incomeByStatus['已取消'].toFixed(2)}</p>
              <p className="text-red-200 text-sm mt-2">{ordersByStatus['已取消'].length} 笔订单</p>
            </div>
          </div>

          {/* 按月份统计 */}
          <div className="bg-white/5 rounded-2xl p-6 mb-6 border border-white/10">
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
              <Calendar className="w-6 h-6 mr-3 text-cyan-400" />
              月度统计
            </h3>
            <div className="space-y-4">
              {Object.keys(ordersByMonth).sort().reverse().map(month => {
                const monthOrders = ordersByMonth[month];
                const monthIncome = monthOrders.reduce((sum, b) => sum + calculateTotalPrice(b), 0);
                return (
                  <div key={month} className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xl font-semibold text-white">{month}</span>
                      <span className="text-2xl font-bold text-green-400">¥{monthIncome.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      <span>{monthOrders.length} 笔订单</span>
                      <span>•</span>
                      <span>平均: ¥{(monthIncome / monthOrders.length).toFixed(2)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 订单明细 */}
          <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
              <Briefcase className="w-6 h-6 mr-3 text-cyan-400" />
              订单明细
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="text-left text-gray-300 font-semibold py-3 px-4">日期</th>
                    <th className="text-left text-gray-300 font-semibold py-3 px-4">客户</th>
                    <th className="text-left text-gray-300 font-semibold py-3 px-4">服务</th>
                    <th className="text-left text-gray-300 font-semibold py-3 px-4">状态</th>
                    <th className="text-right text-gray-300 font-semibold py-3 px-4">定金</th>
                    <th className="text-right text-gray-300 font-semibold py-3 px-4">尾款</th>
                    <th className="text-right text-gray-300 font-semibold py-3 px-4">总价</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map(booking => {
                    const totalPrice = calculateTotalPrice(booking);
                    return (
                      <tr key={booking.id} className="border-b border-white/10 hover:bg-white/5 transition-all">
                        <td className="py-3 px-4 text-white">{booking.date}</td>
                        <td className="py-3 px-4 text-white">{booking.customer_name}</td>
                        <td className="py-3 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            booking.service_type === '接机' 
                              ? 'bg-green-500/20 text-green-300' 
                              : booking.service_type === '送机'
                              ? 'bg-orange-500/20 text-orange-300'
                              : 'bg-purple-500/20 text-purple-300'
                          }`}>
                            {booking.service_type}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusConfig[booking.status || '待服务'].color}`}>
                            {statusConfig[booking.status || '待服务'].label}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-gray-300">¥{(parseFloat(booking.deposit) || 0).toFixed(2)}</td>
                        <td className="py-3 px-4 text-right text-gray-300">¥{(parseFloat(booking.balance) || 0).toFixed(2)}</td>
                        <td className="py-3 px-4 text-right">
                          <span className={`${(booking.payment_status || '未结算') === '已结算' ? 'text-green-400' : 'text-red-400'} font-bold text-lg`}>¥{totalPrice.toFixed(2)}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 修改密码 Modal 组件
const ChangePasswordModal = ({ passwordForm, setPasswordForm, onSubmit, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl shadow-2xl max-w-md w-full border border-white/20">
        <div className="bg-gradient-to-r from-cyan-600 to-blue-500 px-8 py-6 flex items-center justify-between">
          <h2 className="text-3xl font-bold text-white flex items-center">
            <Settings className="w-8 h-8 mr-3" />
            修改密码
          </h2>
          <button
            onClick={onClose}
            className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-all"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>
        
        <form onSubmit={onSubmit} className="p-8">
          <div className="space-y-6">
            {/* 当前密码 */}
            <div>
              <label className="block text-gray-300 font-medium mb-2">当前密码</label>
              <div className="relative">
                <input
                  type={passwordForm.showCurrentPassword ? "text" : "password"}
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                  placeholder="请输入当前密码"
                  required
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
                <button
                  type="button"
                  onClick={() => setPasswordForm({...passwordForm, showCurrentPassword: !passwordForm.showCurrentPassword})}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-all"
                >
                  {passwordForm.showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* 新密码 */}
            <div>
              <label className="block text-gray-300 font-medium mb-2">新密码</label>
              <div className="relative">
                <input
                  type={passwordForm.showNewPassword ? "text" : "password"}
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                  placeholder="请输入新密码（至少6位）"
                  required
                  minLength={6}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
                <button
                  type="button"
                  onClick={() => setPasswordForm({...passwordForm, showNewPassword: !passwordForm.showNewPassword})}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-all"
                >
                  {passwordForm.showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* 确认新密码 */}
            <div>
              <label className="block text-gray-300 font-medium mb-2">确认新密码</label>
              <input
                type={passwordForm.showNewPassword ? "text" : "password"}
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                placeholder="请再次输入新密码"
                required
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              />
            </div>

            {/* 密码强度提示 */}
            {passwordForm.newPassword && (
              <div className="bg-cyan-500/10 border border-cyan-400/30 rounded-xl p-4">
                <p className="text-cyan-300 text-sm">
                  <strong>密码要求：</strong>
                </p>
                <ul className="text-cyan-200 text-sm mt-2 space-y-1 list-disc list-inside">
                  <li className={passwordForm.newPassword.length >= 6 ? 'text-green-400' : ''}>
                    至少6个字符 {passwordForm.newPassword.length >= 6 && '✓'}
                  </li>
                  <li className={passwordForm.newPassword === passwordForm.confirmPassword && passwordForm.confirmPassword ? 'text-green-400' : ''}>
                    两次密码输入一致 {passwordForm.newPassword === passwordForm.confirmPassword && passwordForm.confirmPassword && '✓'}
                  </li>
                  <li className={passwordForm.currentPassword !== passwordForm.newPassword && passwordForm.newPassword ? 'text-green-400' : ''}>
                    不同于当前密码 {passwordForm.currentPassword !== passwordForm.newPassword && passwordForm.newPassword && '✓'}
                  </li>
                </ul>
              </div>
            )}

            {/* 忘记密码提示 */}
            <div className="bg-amber-500/10 border border-amber-400/30 rounded-xl p-4">
              <p className="text-amber-300 text-sm">
                <strong>忘记密码？</strong>
              </p>
              <p className="text-amber-200 text-sm mt-1">
                请联系管理员重置密码。管理员可以通过系统后台为您重置密码。
              </p>
            </div>
          </div>

          {/* 按钮 */}
          <div className="flex space-x-4 mt-8">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-white/10 hover:bg-white/20 text-white font-semibold py-3 px-6 rounded-xl transition-all"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              确认修改
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// 当天订单详情 Modal 组件
const DayBookingsModal = ({ date, bookings, calculateTotalPrice, statusConfig, onEdit, onClose }) => {
  const normalBookings = bookings.filter(b => b.status !== '已取消');
  const cancelledBookings = bookings.filter(b => b.status === '已取消');
  
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-white/20">
        <div className="bg-gradient-to-r from-cyan-600 to-blue-500 px-8 py-6 flex items-center justify-between">
          <h2 className="text-3xl font-bold text-white flex items-center">
            <Calendar className="w-8 h-8 mr-3" />
            {date} 的订单
          </h2>
          <button
            onClick={onClose}
            className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-all"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>
        
        <div className="p-8 overflow-y-auto max-h-[calc(90vh-100px)]">
          {/* 统计信息 */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-500/20 rounded-xl p-4 border border-blue-400/30">
              <p className="text-blue-200 text-sm mb-1">正常订单</p>
              <p className="text-3xl font-bold text-blue-300">{normalBookings.length}</p>
            </div>
            <div className="bg-red-500/20 rounded-xl p-4 border border-red-400/30">
              <p className="text-red-200 text-sm mb-1">已取消</p>
              <p className="text-3xl font-bold text-red-300">{cancelledBookings.length}</p>
            </div>
            <div className="bg-green-500/20 rounded-xl p-4 border border-green-400/30">
              <p className="text-green-200 text-sm mb-1">总收入</p>
              <p className="text-3xl font-bold text-green-300">
                ¥{bookings.reduce((sum, b) => sum + calculateTotalPrice(b), 0).toFixed(2)}
              </p>
            </div>
          </div>

          {/* 正常订单列表 */}
          {normalBookings.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-green-400" />
                正常订单 ({normalBookings.length})
              </h3>
              <div className="space-y-3">
                {normalBookings.map(booking => {
                  const totalPrice = calculateTotalPrice(booking);
                  const StatusIcon = statusConfig[booking.status || '待服务'].icon;
                  return (
                    <div 
                      key={booking.id} 
                      className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all cursor-pointer"
                      onClick={() => {
                        onEdit(booking);
                        onClose();
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              booking.service_type === '接机' 
                                ? 'bg-green-500/20 text-green-300 border border-green-400/30'
                                : booking.service_type === '送机'
                                ? 'bg-orange-500/20 text-orange-300 border border-orange-400/30'
                                : 'bg-purple-500/20 text-purple-300 border border-purple-400/30'
                            }`}>
                              {booking.service_type}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusConfig[booking.status || '待服务'].color}`}>
                              {statusConfig[booking.status || '待服务'].label}
                            </span>
                            <span className="text-white font-semibold text-lg">{booking.time}</span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="text-gray-300">
                              <span className="text-gray-400">客户：</span>
                              <span className="text-white font-medium">{booking.customer_name}</span>
                            </div>
                            <div className="text-gray-300">
                              <span className="text-gray-400">电话：</span>
                              <span className="text-cyan-300">{booking.customer_phone}</span>
                            </div>
                            <div className="text-gray-300">
                              <span className="text-gray-400">上车：</span>
                              <span className="text-white">{booking.pickup}</span>
                            </div>
                            <div className="text-gray-300">
                              <span className="text-gray-400">目的：</span>
                              <span className="text-white">{booking.dropoff}</span>
                            </div>
                            <div className="text-gray-300">
                              <span className="text-gray-400">人数：</span>
                              <span className="text-white">{booking.passengers}人</span>
                              {booking.child_count && <span className="text-gray-400"> ({booking.child_count}儿童)</span>}
                            </div>
                            <div className="text-gray-300">
                              <span className="text-gray-400">行李：</span>
                              <span className="text-white">{booking.luggage}件 ({booking.luggage_size})</span>
                            </div>
                            {booking.source && (
                              <div className="text-gray-300">
                                <span className="text-gray-400">来源：</span>
                                <span className="text-blue-300">{booking.source}</span>
                              </div>
                            )}
                            {booking.assigned_to && (
                              <div className="text-gray-300">
                                <span className="text-gray-400">负责：</span>
                                <span className="text-green-300">{booking.assigned_to}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="ml-4 text-right">
                          <div className={`${(booking.payment_status || '未结算') === '已结算' ? 'text-green-400' : 'text-red-400'} text-2xl font-bold`}>¥{totalPrice.toFixed(2)}</div>
                          <div className="text-gray-400 text-xs mt-1">
                            定金¥{(parseFloat(booking.deposit) || 0).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 已取消订单列表 */}
          {cancelledBookings.length > 0 && (
            <div>
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <Ban className="w-5 h-5 mr-2 text-red-400" />
                已取消订单 ({cancelledBookings.length})
              </h3>
              <div className="space-y-3">
                {cancelledBookings.map(booking => {
                  const totalPrice = calculateTotalPrice(booking);
                  return (
                    <div 
                      key={booking.id} 
                      className="bg-red-500/10 rounded-xl p-4 border border-red-400/30 hover:bg-red-500/20 transition-all cursor-pointer opacity-75"
                      onClick={() => {
                        onEdit(booking);
                        onClose();
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              booking.service_type === '接机' 
                                ? 'bg-green-500/20 text-green-300 border border-green-400/30'
                                : booking.service_type === '送机'
                                ? 'bg-orange-500/20 text-orange-300 border border-orange-400/30'
                                : 'bg-purple-500/20 text-purple-300 border border-purple-400/30'
                            }`}>
                              {booking.service_type}
                            </span>
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-500/20 text-red-300 border-red-400/30">
                              已取消
                            </span>
                            <span className="text-white font-semibold text-lg">{booking.time}</span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="text-gray-300">
                              <span className="text-gray-400">客户：</span>
                              <span className="text-white font-medium">{booking.customer_name}</span>
                            </div>
                            <div className="text-gray-300">
                              <span className="text-gray-400">电话：</span>
                              <span className="text-cyan-300">{booking.customer_phone}</span>
                            </div>
                            <div className="text-gray-300">
                              <span className="text-gray-400">上车：</span>
                              <span className="text-white">{booking.pickup}</span>
                            </div>
                            <div className="text-gray-300">
                              <span className="text-gray-400">目的：</span>
                              <span className="text-white">{booking.dropoff}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="ml-4 text-right">
                          <div className="text-red-400 text-2xl font-bold">¥{totalPrice.toFixed(2)}</div>
                          <div className="text-gray-400 text-xs mt-1">仅定金</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {bookings.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">当天没有订单</p>
            </div>
          )}
        </div>

        <div className="bg-white/5 px-8 py-4 border-t border-white/10">
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold py-3 rounded-xl transition-all"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};

// 图片查看器组件
const ImageViewer = ({ imageUrl, onClose }) => {
  const [scale, setScale] = React.useState(1);
  const [position, setPosition] = React.useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 });
  
  // 双指缩放相关状态
  const [initialDistance, setInitialDistance] = React.useState(0);
  const [initialScale, setInitialScale] = React.useState(1);

  if (!imageUrl) return null;

  // 计算两个触摸点之间的距离
  const getDistance = (touch1, touch2) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // 键盘快捷键
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      switch(e.key) {
        case 'Escape':
          onClose();
          break;
        case '+':
        case '=':
          handleZoomIn();
          break;
        case '-':
        case '_':
          handleZoomOut();
          break;
        case '0':
          handleReset();
          break;
        case 'f':
        case 'F':
          handleFit();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [scale]);

  // 缩放控制
  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.25, 5));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.25));
  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };
  const handleFit = () => {
    setScale(0.9);
    setPosition({ x: 0, y: 0 });
  };

  // 鼠标滚轮缩放
  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setScale(prev => Math.max(0.25, Math.min(5, prev + delta)));
  };

  // 鼠标拖拽
  const handleMouseDown = (e) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // 触摸事件处理（支持双指缩放）
  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      // 双指缩放开始
      const distance = getDistance(e.touches[0], e.touches[1]);
      setInitialDistance(distance);
      setInitialScale(scale);
      setIsDragging(false);
    } else if (e.touches.length === 1 && scale > 1) {
      // 单指拖拽
      setIsDragging(true);
      setDragStart({ 
        x: e.touches[0].clientX - position.x, 
        y: e.touches[0].clientY - position.y 
      });
    }
  };

  const handleTouchMove = (e) => {
    e.preventDefault(); // 防止页面滚动
    
    if (e.touches.length === 2) {
      // 双指缩放
      const distance = getDistance(e.touches[0], e.touches[1]);
      const scaleChange = distance / initialDistance;
      const newScale = Math.max(0.25, Math.min(5, initialScale * scaleChange));
      setScale(newScale);
    } else if (isDragging && e.touches.length === 1 && scale > 1) {
      // 单指拖拽
      setPosition({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y
      });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setInitialDistance(0);
  };

  return (
    <div 
      className="fixed inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn"
      onClick={onClose}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ touchAction: 'none' }} // 禁用浏览器默认触摸行为
    >
      <div className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center">
        {/* 顶部工具栏 */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white/10 hover:bg-white/15 backdrop-blur-md px-4 py-2 rounded-full transition-all z-10 flex items-center space-x-2 shadow-xl">
          <button
            onClick={(e) => { e.stopPropagation(); handleZoomOut(); }}
            className="p-2 hover:bg-white/20 rounded-full transition-all active:scale-95"
            title="缩小 (- 键 / 滚轮向下)"
          >
            <span className="text-white text-xl font-bold">−</span>
          </button>
          
          <span className="text-white text-sm font-medium min-w-[60px] text-center select-none">
            {Math.round(scale * 100)}%
          </span>
          
          <button
            onClick={(e) => { e.stopPropagation(); handleZoomIn(); }}
            className="p-2 hover:bg-white/20 rounded-full transition-all active:scale-95"
            title="放大 (+ 键 / 滚轮向上)"
          >
            <span className="text-white text-xl font-bold">+</span>
          </button>
          
          <div className="w-px h-6 bg-white/30 mx-2"></div>
          
          <button
            onClick={(e) => { e.stopPropagation(); handleFit(); }}
            className="px-3 py-1 hover:bg-white/20 rounded-full transition-all text-white text-sm active:scale-95"
            title="适应屏幕 (F 键)"
          >
            适应
          </button>
          
          <button
            onClick={(e) => { e.stopPropagation(); handleReset(); }}
            className="px-3 py-1 hover:bg-white/20 rounded-full transition-all text-white text-sm active:scale-95"
            title="重置 (0 键)"
          >
            重置
          </button>
        </div>

        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-red-500/80 hover:bg-red-500 backdrop-blur-sm p-3 rounded-full transition-all z-10 shadow-xl active:scale-95"
          title="关闭 (Esc 键)"
        >
          <X className="w-6 h-6 text-white" />
        </button>

        {/* 图片 */}
        <img
          src={imageUrl}
          alt="查看图片"
          className="max-w-full max-h-full object-contain rounded-lg shadow-2xl transition-transform select-none"
          style={{
            transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
            cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
            touchAction: 'none'
          }}
          onClick={(e) => e.stopPropagation()}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          draggable={false}
        />

        {/* 底部提示 */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 backdrop-blur-md px-6 py-3 rounded-full shadow-xl">
          <p className="text-white text-xs sm:text-sm text-center">
            📱 双指缩放 · {scale > 1 ? '🖱️ 拖拽移动 · ' : ''}🖱️ 滚轮缩放 · ⌨️ +/- 缩放 · ⌨️ Esc 关闭
          </p>
        </div>

        {/* 缩放等级指示器 */}
        {scale !== 1 && (
          <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-cyan-500/80 backdrop-blur-md px-4 py-2 rounded-full shadow-xl">
            <p className="text-white text-sm font-bold">
              {scale > 1 ? `🔍 放大 ${Math.round(scale * 100)}%` : `🔍 缩小 ${Math.round(scale * 100)}%`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EastMountTravelSystem;
