import React, { useState, useEffect } from 'react';
import { View, Text, Input, Button, ScrollView, Picker, Textarea } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { getAllCustomers, saveAllCustomers, getCommunities, saveCommunities, getInsuranceTypes, saveInsuranceTypes, generateSeq, showToast, addHistory } from '@/utils/storage';
import { Customer, Visit, Insured, AddressInfo } from '@/types';
import { geocodeAddress, reverseGeocode, getCurrentLocation } from '@/services/amap';

export default function AddPage() {
  const [customerName, setCustomerName] = useState('');
  const [customerGender, setCustomerGender] = useState('');
  const [calcAge, setCalcAge] = useState('');
  const [birthMonthDay, setBirthMonthDay] = useState('');
  const [customerBirthday, setCustomerBirthday] = useState('');
  const [calcResult, setCalcResult] = useState('');
  const [building, setBuilding] = useState('');
  const [phone, setPhone] = useState('');
  const [community, setCommunity] = useState('');
  const [communities, setCommunities] = useState<string[]>([]);
  const [newCommunityName, setNewCommunityName] = useState('');
  const [insuranceTypes, setInsuranceTypes] = useState<string[]>([]);
  const [selectedInsuranceTypes, setSelectedInsuranceTypes] = useState<string[]>([]);
  const [newInsuranceType, setNewInsuranceType] = useState('');
  const [insuranceContent, setInsuranceContent] = useState('');
  const [visitDate, setVisitDate] = useState('');
  const [visitNote, setVisitNote] = useState('');
  const [currentVisits, setCurrentVisits] = useState<Visit[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [insuredName, setInsuredName] = useState('');
  const [insuredGender, setInsuredGender] = useState('');
  const [insuredAge, setInsuredAge] = useState('');
  const [insuredMonthDay, setInsuredMonthDay] = useState('');
  const [insuredBirthday, setInsuredBirthday] = useState('');
  const [insuredCalcResult, setInsuredCalcResult] = useState('');
  const [insuredRelation, setInsuredRelation] = useState('');

  // 详细地址相关状态
  const [addrProvince, setAddrProvince] = useState('');
  const [addrCity, setAddrCity] = useState('');
  const [addrDistrict, setAddrDistrict] = useState('');
  const [addrDetail, setAddrDetail] = useState('');
  const [addrLongitude, setAddrLongitude] = useState('');
  const [addrLatitude, setAddrLatitude] = useState('');
  const [addrGeocoding, setAddrGeocoding] = useState(false); // 正在地理编码
  const [addrLocating, setAddrLocating] = useState(false);   // 正在定位

  useEffect(() => {
    setCommunities(getCommunities());
    setInsuranceTypes(getInsuranceTypes());
    
    const editingData = Taro.getStorageSync('editingCustomer');
    if (editingData) {
      try {
        const customer: Customer = JSON.parse(editingData);
        setEditingId(customer.id);
        setCustomerName(customer.name);
        setCustomerGender(customer.gender);
        setCalcAge(customer.age);
        setBuilding(customer.building);
        setPhone(customer.phone);
        setCommunity(customer.community);
        setSelectedInsuranceTypes(customer.insuranceTypes || []);
        setInsuranceContent(customer.insuranceContent || '');
        setCurrentVisits(customer.visits || []);
        
        if (customer.birthday) {
          const parts = customer.birthday.split('-');
          if (parts.length === 3) {
            setBirthMonthDay(parts[1] + '-' + parts[2]);
            setCustomerBirthday(customer.birthday);
            setCalcResult(customer.birthday);
          } else {
            setBirthMonthDay(customer.birthday);
          }
        }
        
        const insured = customer.insured || {};
        setInsuredName(insured.name || '');
        setInsuredGender(insured.gender || '');
        setInsuredAge(insured.age || '');
        setInsuredRelation(insured.relation || '');

        // 回填详细地址
        const addr = customer.address || {} as AddressInfo;
        setAddrProvince(addr.province || '');
        setAddrCity(addr.city || '');
        setAddrDistrict(addr.district || '');
        setAddrDetail(addr.detail || '');
        setAddrLongitude(addr.longitude || '');
        setAddrLatitude(addr.latitude || '');
        
        if (insured.birthday) {
          const parts = insured.birthday.split('-');
          if (parts.length === 3) {
            setInsuredMonthDay(parts[1] + '-' + parts[2]);
            setInsuredBirthday(insured.birthday);
            setInsuredCalcResult(insured.birthday);
          } else {
            setInsuredMonthDay(insured.birthday);
          }
        }
        
        Taro.removeStorageSync('editingCustomer');
      } catch (e) {
        console.error('Failed to parse editing customer:', e);
      }
    }
  }, []);

  const calculateBirthday = () => {
    const age = calcAge;
    const monthDay = birthMonthDay.trim();
    if (!age || !monthDay) {
      setCalcResult('');
      setCustomerBirthday('');
      return;
    }
    
    const ageNum = parseInt(age);
    if (isNaN(ageNum) || ageNum < 0 || ageNum > 150) {
      showToast('请输入有效的年龄(0-150)', 'warning');
      return;
    }
    
    const parts = monthDay.split(/[-\/.]/);
    if (parts.length !== 2) {
      showToast('请输入正确格式的月日(如: 06-15)', 'warning');
      return;
    }
    
    const month = parseInt(parts[0]);
    const day = parseInt(parts[1]);
    if (isNaN(month) || isNaN(day) || month < 1 || month > 12 || day < 1 || day > 31) {
      showToast('请输入有效的月日(月:1-12,日:1-31)', 'warning');
      return;
    }
    
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    const currentDay = today.getDate();
    let birthYear = currentYear - ageNum;
    
    if (month > currentMonth || (month === currentMonth && day > currentDay)) {
      birthYear--;
    }
    
    const monthStr = month.toString().padStart(2, '0');
    const dayStr = day.toString().padStart(2, '0');
    const birthdayStr = birthYear + '-' + monthStr + '-' + dayStr;
    
    setCustomerBirthday(birthdayStr);
    setCalcResult(birthdayStr);
    showToast('已计算出生年月日: ' + birthdayStr, 'success');
  };

  const calculateInsuredBirthday = () => {
    const age = insuredAge;
    const monthDay = insuredMonthDay.trim();
    if (!age || !monthDay) {
      setInsuredCalcResult('');
      setInsuredBirthday('');
      return;
    }
    
    const ageNum = parseInt(age);
    if (isNaN(ageNum) || ageNum < 0 || ageNum > 150) {
      showToast('请输入有效的年龄(0-150)', 'warning');
      return;
    }
    
    const parts = monthDay.split(/[-\/.]/);
    if (parts.length !== 2) {
      showToast('请输入正确格式的月日(如: 06-15)', 'warning');
      return;
    }
    
    const month = parseInt(parts[0]);
    const day = parseInt(parts[1]);
    if (isNaN(month) || isNaN(day) || month < 1 || month > 12 || day < 1 || day > 31) {
      showToast('请输入有效的月日(月:1-12,日:1-31)', 'warning');
      return;
    }
    
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    const currentDay = today.getDate();
    let birthYear = currentYear - ageNum;
    
    if (month > currentMonth || (month === currentMonth && day > currentDay)) {
      birthYear--;
    }
    
    const monthStr = month.toString().padStart(2, '0');
    const dayStr = day.toString().padStart(2, '0');
    const birthdayStr = birthYear + '-' + monthStr + '-' + dayStr;
    
    setInsuredBirthday(birthdayStr);
    setInsuredCalcResult(birthdayStr);
    showToast('被保人出生年月日: ' + birthdayStr, 'success');
  };

  const addCommunity = () => {
    const name = newCommunityName.trim();
    if (!name) {
      showToast('请输入小区名称', 'warning');
      return;
    }
    
    const newCommunities = [...communities];
    if (newCommunities.indexOf(name) !== -1) {
      showToast('该小区已存在', 'warning');
      return;
    }
    
    newCommunities.push(name);
    saveCommunities(newCommunities);
    setCommunities(newCommunities);
    setCommunity(name);
    setNewCommunityName('');
    showToast('已添加小区: ' + name, 'success');
    addHistory('小区管理', '新增小区: ' + name);
  };

  const removeCommunity = (name: string) => {
    const DEFAULT_COMMUNITIES = ['博雅馨城', '育苗佳苑', '西延锦绣', '红色佳苑', '锦熙玉苑', '西西里公园', '金港湾花园', '福祥瑞康苑', '福祥瑞祥苑', '福祥瑞福苑'];
    
    if (DEFAULT_COMMUNITIES.indexOf(name) !== -1) {
      showToast('默认小区无法删除', 'warning');
      return;
    }
    
    const customers = getAllCustomers();
    if (customers.some(c => c.community === name)) {
      showToast('该小区下存在客户，无法删除', 'warning');
      return;
    }
    
    const newCommunities = communities.filter(c => c !== name);
    saveCommunities(newCommunities);
    setCommunities(newCommunities);
    if (community === name) {
      setCommunity('');
    }
    showToast('已删除小区: ' + name, 'success');
    addHistory('小区管理', '删除小区: ' + name);
  };

  const toggleSelectAllInsurance = () => {
    setSelectedInsuranceTypes(
      selectedInsuranceTypes.length === insuranceTypes.length ? [] : [...insuranceTypes]
    );
  };

  const toggleInsuranceType = (name: string) => {
    setSelectedInsuranceTypes(prev => {
      const idx = prev.indexOf(name);
      if (idx !== -1) {
        return prev.filter(t => t !== name);
      }
      return [...prev, name];
    });
  };

  const addInsuranceType = () => {
    const name = newInsuranceType.trim();
    if (!name) {
      showToast('请输入险种名称', 'warning');
      return;
    }
    
    const newTypes = [...insuranceTypes];
    if (newTypes.indexOf(name) !== -1) {
      showToast('该险种已存在', 'warning');
      return;
    }
    
    newTypes.push(name);
    saveInsuranceTypes(newTypes);
    setInsuranceTypes(newTypes);
    setNewInsuranceType('');
    showToast('已添加险种: ' + name, 'success');
    addHistory('保险管理', '新增险种: ' + name);
  };

  const addVisit = () => {
    if (!visitDate) {
      showToast('请选择约访日期', 'warning');
      return;
    }
    if (!visitNote.trim()) {
      showToast('请填写面访记录', 'warning');
      return;
    }

    setCurrentVisits(prev => [...prev, { date: visitDate, note: visitNote.trim() }]);
    setVisitDate('');
    setVisitNote('');
    showToast('已添加约访记录', 'success');
  };

  /**
   * 拼接当前表单中的完整地址
   */
  const buildFullAddress = () => {
    return [addrProvince, addrCity, addrDistrict, addrDetail].filter(Boolean).join('');
  };

  /**
   * 调用高德地理编码：地址 -> 经纬度
   */
  const handleGeocode = async () => {
    const full = buildFullAddress();
    if (!full) {
      showToast('请先填写省/市/区或详细地址', 'warning');
      return;
    }
    setAddrGeocoding(true);
    Taro.showLoading({ title: '解析地址中...', mask: true });
    try {
      const result = await geocodeAddress(full);
      if (result) {
        setAddrLongitude(result.longitude);
        setAddrLatitude(result.latitude);
        showToast(`地址定位成功：${result.longitude},${result.latitude}`, 'success');
        addHistory('地址定位', `解析地址: ${full}`);
      } else {
        showToast('未找到该地址的经纬度，请补充更详细的地址', 'warning');
      }
    } finally {
      setAddrGeocoding(false);
      Taro.hideLoading();
    }
  };

  /**
   * 获取当前位置并逆地理编码填充表单
   */
  const handleLocate = async () => {
    setAddrLocating(true);
    Taro.showLoading({ title: '获取定位中...', mask: true });
    try {
      const pos = await getCurrentLocation();
      if (!pos) {
        showToast('定位失败，请检查定位权限', 'error');
        return;
      }
      setAddrLongitude(pos.longitude);
      setAddrLatitude(pos.latitude);
      const addr = await reverseGeocode(pos.longitude, pos.latitude);
      if (addr) {
        setAddrProvince(addr.province || addrProvince);
        setAddrCity(addr.city || addrCity);
        setAddrDistrict(addr.district || addrDistrict);
        if (!addrDetail && addr.fullAddress) {
          // 逆地理编码的完整地址去掉省市区前缀，只填入详细部分
          let detail = addr.fullAddress;
          if (addr.province) detail = detail.replace(addr.province, '');
          if (addr.city) detail = detail.replace(addr.city, '');
          if (addr.district) detail = detail.replace(addr.district, '');
          setAddrDetail(detail);
        }
        showToast('已根据当前位置填充地址', 'success');
        addHistory('地址定位', `当前位置: ${addr.fullAddress}`);
      } else {
        showToast('已获取坐标，但逆地理编码失败', 'warning');
      }
    } finally {
      setAddrLocating(false);
      Taro.hideLoading();
    }
  };

  /**
   * 清空地址
   */
  const clearAddress = () => {
    setAddrProvince('');
    setAddrCity('');
    setAddrDistrict('');
    setAddrDetail('');
    setAddrLongitude('');
    setAddrLatitude('');
  };

  const saveCustomer = () => {
    if (!customerName.trim()) {
      showToast('请输入姓名', 'warning');
      return;
    }
    if (!customerGender) {
      showToast('请选择性别', 'warning');
      return;
    }
    if (!phone.trim()) {
      showToast('请输入联系电话', 'warning');
      return;
    }
    if (!community) {
      showToast('请选择所属小区', 'warning');
      return;
    }
    
    let finalName = customerName.trim();
    const customers = getAllCustomers();
    const isEdit = !!editingId;
    
    if (!isEdit) {
      const sameNameSameGender = customers.filter(c => {
        const baseMatch = c.name.match(/^(.+?)(\d+)$/);
        const baseName = baseMatch ? baseMatch[1] : c.name;
        return baseName === finalName && c.gender === customerGender;
      });
      
      if (sameNameSameGender.length > 0) {
        let num = 2;
        while (true) {
          const testName = finalName + num;
          if (!customers.some(c => c.name === testName)) {
            finalName = testName;
            break;
          }
          num++;
        }
      }
    }
    
    const birthday = customerBirthday || birthMonthDay;
    const insured: Insured = {
      name: insuredName.trim(),
      gender: insuredGender,
      age: insuredAge,
      birthday: insuredBirthday || insuredMonthDay,
      relation: insuredRelation
    };

    // 详细地址
    const fullAddress = buildFullAddress();
    const address: AddressInfo = {
      province: addrProvince.trim(),
      city: addrCity.trim(),
      district: addrDistrict.trim(),
      detail: addrDetail.trim(),
      fullAddress,
      longitude: addrLongitude,
      latitude: addrLatitude
    };

    const customer: Customer = {
      id: isEdit ? editingId! : Date.now(),
      seq: isEdit ? (customers.find(c => c.id === editingId)?.seq || 0) : generateSeq(),
      name: finalName,
      gender: customerGender,
      age: calcAge,
      birthday,
      building: building.trim(),
      phone: phone.trim(),
      community,
      address,
      insuranceTypes: selectedInsuranceTypes,
      insuranceContent: insuranceContent.trim(),
      visits: currentVisits,
      insured,
      createdAt: isEdit ? (customers.find(c => c.id === editingId)?.createdAt || '') : new Date().toLocaleString('zh-CN'),
      updatedAt: new Date().toLocaleString('zh-CN')
    };
    
    let newCustomers;
    if (isEdit) {
      newCustomers = customers.map(c => c.id === editingId ? customer : c);
    } else {
      newCustomers = [...customers, customer];
    }
    
    saveAllCustomers(newCustomers);
    showToast(isEdit ? '客户信息已更新' : '客户信息已保存', 'success');
    addHistory(isEdit ? '编辑客户' : '新增客户', `${finalName}(${phone})`);
    
    clearForm();
  };

  const clearForm = () => {
    setCustomerName('');
    setCustomerGender('');
    setCalcAge('');
    setBirthMonthDay('');
    setCustomerBirthday('');
    setCalcResult('');
    setBuilding('');
    setPhone('');
    setCommunity('');
    setSelectedInsuranceTypes([]);
    setInsuranceContent('');
    setCurrentVisits([]);
    setVisitDate('');
    setVisitNote('');
    setEditingId(null);

    setInsuredName('');
    setInsuredGender('');
    setInsuredAge('');
    setInsuredMonthDay('');
    setInsuredBirthday('');
    setInsuredCalcResult('');
    setInsuredRelation('');

    // 清空地址
    setAddrProvince('');
    setAddrCity('');
    setAddrDistrict('');
    setAddrDetail('');
    setAddrLongitude('');
    setAddrLatitude('');
  };

  return (
    <ScrollView className={styles.container} scrollY>
      <View className={styles.card}>
        <Text className={styles.cardTitle}>投保人信息</Text>
        
        <View className={styles.formGroup}>
          <Text className={styles.formLabel}>姓名 *</Text>
          <Input 
            className={styles.formControl}
            placeholder="请输入客户姓名"
            value={customerName}
            onInput={(e) => setCustomerName(e.detail.value)}
          />
        </View>

        <View className={styles.formGroup}>
          <Text className={styles.formLabel}>性别 *</Text>
          <Picker 
            mode="selector" 
            range={['男', '女']}
            value={customerGender === '男' ? 0 : customerGender === '女' ? 1 : -1}
            onChange={(e) => setCustomerGender(['男', '女'][e.detail.value])}
          >
            <View className={styles.formSelect}>
              <Text>{customerGender || '请选择性别'}</Text>
            </View>
          </Picker>
        </View>

        <View className={styles.formGroup}>
          <Text className={styles.formLabel}>出生月份和日期</Text>
          <Input 
            className={styles.formControl}
            placeholder="格式: MM-DD 如: 06-15"
            value={birthMonthDay}
            onInput={(e) => setBirthMonthDay(e.detail.value)}
            onBlur={calculateBirthday}
          />
        </View>

        <View className={styles.birthdayCalcGroup}>
          <Input 
            className={styles.calcAgeInput}
            type="number"
            placeholder="输入年龄"
            value={calcAge}
            onInput={(e) => setCalcAge(e.detail.value)}
          />
          <Button className={styles.calcBtn} onClick={calculateBirthday}>
            <Text>计算出生年月日</Text>
          </Button>
          <Input 
            className={styles.calcResultInput}
            placeholder="出生年月日"
            value={calcResult}
            disabled
          />
        </View>

        <View className={styles.formGroup}>
          <Text className={styles.formLabel}>单元楼号</Text>
          <Input 
            className={styles.formControl}
            placeholder="如: 1栋2单元301"
            value={building}
            onInput={(e) => setBuilding(e.detail.value)}
          />
        </View>

        <View className={styles.formGroup}>
          <Text className={styles.formLabel}>联系电话 *</Text>
          <Input 
            className={styles.formControl}
            type="number"
            placeholder="请输入联系电话"
            value={phone}
            onInput={(e) => setPhone(e.detail.value)}
          />
        </View>
      </View>

      <View className={styles.communitySection}>
        <View className={styles.communityHeader}>
          <Text className={styles.communityTitle}>小区管理</Text>
        </View>
        <View className={styles.communityAddRow}>
          <Input 
            className={styles.communityAddInput}
            placeholder="输入新小区名称"
            value={newCommunityName}
            onInput={(e) => setNewCommunityName(e.detail.value)}
            confirmType="done"
            onConfirm={addCommunity}
          />
          <Button className={styles.calcBtn} onClick={addCommunity}>
            <Text>+ 添加</Text>
          </Button>
        </View>
        <View className={styles.communityListWrap}>
          {communities.map(name => (
            <View key={name} className={styles.communityTag}>
              <Text>{name}</Text>
              {communities.indexOf(name) > 9 && (
                <Button className={styles.removeBtn} onClick={() => removeCommunity(name)}>
                  <Text>-</Text>
                </Button>
              )}
            </View>
          ))}
        </View>
      </View>

      <View className={styles.card}>
        <View className={styles.formGroup}>
          <Text className={styles.formLabel}>所属小区 *</Text>
          <Picker
            mode="selector"
            range={communities}
            value={communities.indexOf(community)}
            onChange={(e) => setCommunity(communities[e.detail.value])}
          >
            <View className={styles.formSelect}>
              <Text>{community || '请选择小区'}</Text>
            </View>
          </Picker>
        </View>
      </View>

      {/* 详细地址录入 */}
      <View className={styles.addressSection}>
        <View className={styles.addressHeader}>
          <Text className={styles.addressTitle}>详细地址</Text>
          <Text className={styles.addressHint}>用于一键导航规划</Text>
        </View>

        <View className={styles.addressRow}>
          <Input
            className={styles.addressInput}
            placeholder="省"
            value={addrProvince}
            onInput={(e) => setAddrProvince(e.detail.value)}
          />
          <Input
            className={styles.addressInput}
            placeholder="市"
            value={addrCity}
            onInput={(e) => setAddrCity(e.detail.value)}
          />
          <Input
            className={styles.addressInput}
            placeholder="区/县"
            value={addrDistrict}
            onInput={(e) => setAddrDistrict(e.detail.value)}
          />
        </View>

        <View className={styles.formGroup}>
          <Text className={styles.formLabel}>街道门牌号</Text>
          <Input
            className={styles.formControl}
            placeholder="如: 天府大道北段1号1栋2单元301"
            value={addrDetail}
            onInput={(e) => setAddrDetail(e.detail.value)}
          />
        </View>

        <View className={styles.addressCoordRow}>
          <View className={styles.coordBox}>
            <Text className={styles.coordLabel}>经度</Text>
            <Text className={styles.coordValue}>{addrLongitude || '未解析'}</Text>
          </View>
          <View className={styles.coordBox}>
            <Text className={styles.coordLabel}>纬度</Text>
            <Text className={styles.coordValue}>{addrLatitude || '未解析'}</Text>
          </View>
        </View>

        <View className={styles.addressBtns}>
          <Button
            className={`${styles.calcBtn} ${styles.addressBtn}`}
            onClick={handleLocate}
            loading={addrLocating}
            disabled={addrLocating}
          >
            <Text>📍 获取定位</Text>
          </Button>
          <Button
            className={`${styles.calcBtn} ${styles.addressBtn}`}
            onClick={handleGeocode}
            loading={addrGeocoding}
            disabled={addrGeocoding}
          >
            <Text>🔍 解析地址</Text>
          </Button>
          <Button className={`${styles.calcBtn} ${styles.addressBtnClear}`} onClick={clearAddress}>
            <Text>清空</Text>
          </Button>
        </View>

        {addrLongitude && addrLatitude ? (
          <View className={styles.addressTipOk}>
            <Text>✓ 地址已解析，可一键导航</Text>
          </View>
        ) : (
          <View className={styles.addressTipWarn}>
            <Text>提示：录入完整地址后点击「解析地址」获取经纬度，即可在保单列表中一键导航</Text>
          </View>
        )}
      </View>

      <View className={styles.insuredSection}>
        <Text className={styles.insuredHeader}>被保人信息</Text>
        
        <View className={styles.formGroup}>
          <Text className={styles.formLabel}>被保人姓名</Text>
          <Input 
            className={styles.formControl}
            placeholder="请输入被保人姓名"
            value={insuredName}
            onInput={(e) => setInsuredName(e.detail.value)}
          />
        </View>

        <View className={styles.formGroup}>
          <Text className={styles.formLabel}>被保人性别</Text>
          <Picker 
            mode="selector" 
            range={['男', '女']}
            value={insuredGender === '男' ? 0 : insuredGender === '女' ? 1 : -1}
            onChange={(e) => setInsuredGender(['男', '女'][e.detail.value])}
          >
            <View className={styles.formSelect}>
              <Text>{insuredGender || '请选择性别'}</Text>
            </View>
          </Picker>
        </View>

        <View className={styles.formGroup}>
          <Text className={styles.formLabel}>被保人出生月份和日期</Text>
          <Input 
            className={styles.formControl}
            placeholder="格式: MM-DD 如: 06-15"
            value={insuredMonthDay}
            onInput={(e) => setInsuredMonthDay(e.detail.value)}
            onBlur={calculateInsuredBirthday}
          />
        </View>

        <View className={styles.birthdayCalcGroup}>
          <Input 
            className={styles.calcAgeInput}
            type="number"
            placeholder="输入年龄"
            value={insuredAge}
            onInput={(e) => setInsuredAge(e.detail.value)}
          />
          <Button className={styles.calcBtn} onClick={calculateInsuredBirthday}>
            <Text>计算出生年月日</Text>
          </Button>
          <Input 
            className={styles.calcResultInput}
            placeholder="出生年月日"
            value={insuredCalcResult}
            disabled
          />
        </View>

        <View className={styles.formGroup}>
          <Text className={styles.formLabel}>与客户关系</Text>
          <Picker 
            mode="selector" 
            range={['本人', '配偶', '父母', '子女', '兄弟姐妹', '其他']}
            value={['本人', '配偶', '父母', '子女', '兄弟姐妹', '其他'].indexOf(insuredRelation)}
            onChange={(e) => {
            const relation = ['本人', '配偶', '父母', '子女', '兄弟姐妹', '其他'][e.detail.value];
            setInsuredRelation(relation);
            if (relation === '本人') {
              setInsuredName(customerName);
              setInsuredGender(customerGender);
              setInsuredAge(calcAge);
              setInsuredMonthDay(birthMonthDay);
              setInsuredBirthday(customerBirthday);
              setInsuredCalcResult(calcResult);
            }
          }}
          >
            <View className={styles.formSelect}>
              <Text>{insuredRelation || '请选择关系'}</Text>
            </View>
          </Picker>
        </View>
      </View>

      <View className={styles.insuranceSection}>
        <View className={styles.insuranceHeader}>
          <Text className={styles.insuranceTitle}>保险险种</Text>
          <Button className={styles.calcBtn} onClick={toggleSelectAllInsurance}>
            <Text>一键全选</Text>
          </Button>
        </View>
        <View className={styles.insuranceTypesWrap}>
          {insuranceTypes.map(name => (
            <Button 
              key={name}
              className={`${styles.insuranceTypeTag} ${selectedInsuranceTypes.indexOf(name) !== -1 ? styles.selected : ''}`}
              onClick={() => toggleInsuranceType(name)}
            >
              <Text>{name}</Text>
            </Button>
          ))}
        </View>
        <View className={styles.insuranceAddRow}>
          <Input 
            className={styles.insuranceAddInput}
            placeholder="输入新险种名称"
            value={newInsuranceType}
            onInput={(e) => setNewInsuranceType(e.detail.value)}
            confirmType="done"
            onConfirm={addInsuranceType}
          />
          <Button className={styles.calcBtn} onClick={addInsuranceType}>
            <Text>+ 添加</Text>
          </Button>
        </View>
        <View className={styles.formGroup}>
          <Text className={styles.formLabel}>保障内容</Text>
          <Textarea 
            className={styles.formTextarea}
            placeholder="请输入保障内容..."
            value={insuranceContent}
            onInput={(e) => setInsuranceContent(e.detail.value)}
          />
        </View>
      </View>

      <View className={styles.visitSection}>
        <View className={styles.visitHeader}>
          <Text className={styles.visitTitle}>见面备注</Text>
          <Text className={styles.visitCount}>{currentVisits.length}次约访</Text>
        </View>
        <View className={styles.visitAddForm}>
          <Input 
            className={styles.visitDateInput}
            type="date"
            value={visitDate}
            onInput={(e) => setVisitDate(e.detail.value)}
          />
          <Textarea 
            className={styles.visitNoteInput}
            placeholder="面访记录..."
            value={visitNote}
            onInput={(e) => setVisitNote(e.detail.value)}
          />
          <Button className={styles.calcBtn} onClick={addVisit}>
            <Text>+ 添加</Text>
          </Button>
        </View>
        <View className={styles.visitList}>
          {currentVisits.length === 0 ? (
            <Text className={styles.infoValue}>暂无约访记录</Text>
          ) : (
            currentVisits.map((visit, idx) => (
              <View key={idx} className={styles.visitItem}>
                <View className={styles.visitItemHeader}>
                  <Text>{visit.date}</Text>
                </View>
                <View className={styles.visitItemContent}>
                  <Text>{visit.note}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </View>

      <View className={styles.btnGroup}>
        <Button className={`${styles.btn} ${styles.btnPrimary}`} onClick={saveCustomer}>
          <Text>{editingId ? '更新保单' : '保存保单'}</Text>
        </Button>
        <Button className={`${styles.btn} ${styles.btnNeutral}`} onClick={clearForm}>
          <Text>清空表单</Text>
        </Button>
      </View>
    </ScrollView>
  );
}