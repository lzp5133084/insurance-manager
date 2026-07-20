import React, { useState, useEffect } from 'react';
import { View, Text, Input, Button, ScrollView, Picker } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { getAllCustomers, deleteCustomer, getCommunities, showToast, addHistory } from '@/utils/storage';
import { Customer, RoutePlanResult } from '@/types';
import { drivingRoute, getCurrentLocation, openNavigation } from '@/services/amap';

export default function ListPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterCommunity, setFilterCommunity] = useState('');
  const [filterGender, setFilterGender] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [communities, setCommunities] = useState<string[]>([]);

  // 导航规划相关状态
  const [routePlanning, setRoutePlanning] = useState(false);     // 是否正在规划
  const [routeResult, setRouteResult] = useState<RoutePlanResult | null>(null); // 规划结果
  const [routeModalOpen, setRouteModalOpen] = useState(false);   // 是否显示弹窗
  const [routeTarget, setRouteTarget] = useState<Customer | null>(null); // 目标客户

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setCustomers(getAllCustomers());
    setCommunities(getCommunities());
    setCurrentPage(1);
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredCustomers = customers.filter(c => {
    const matchKeyword = !searchKeyword || 
      c.name.toLowerCase().includes(searchKeyword.toLowerCase()) || 
      c.phone.includes(searchKeyword) || 
      c.community.includes(searchKeyword);
    const matchCommunity = !filterCommunity || c.community === filterCommunity;
    const matchGender = !filterGender || c.gender === filterGender;
    return matchKeyword && matchCommunity && matchGender;
  });

  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / pageSize));
  const startIdx = (currentPage - 1) * pageSize;
  const endIdx = startIdx + pageSize;
  const pageData = filteredCustomers.slice(startIdx, endIdx);

  const handleEdit = (customer: Customer) => {
    Taro.setStorageSync('editingCustomer', JSON.stringify(customer));
    Taro.switchTab({
      url: '/pages/add/index'
    });
  };

  const handleDelete = (customer: Customer) => {
    Taro.showModal({
      title: '确认删除',
      content: `确定要删除客户「${customer.name}」吗？`,
      success: (res) => {
        if (res.confirm) {
          deleteCustomer(customer.id);
          addHistory('删除客户', `${customer.name}(${customer.phone})`);
          showToast('客户已删除', 'success');
          loadData();
        }
      }
    });
  };

  const handleSearch = () => {
    setCurrentPage(1);
  };

  /**
   * 一键导航：获取当前位置 -> 调用高德驾车路径规划 -> 弹窗展示结果
   */
  const handleNavigate = async (customer: Customer) => {
    if (!customer.address || !customer.address.longitude || !customer.address.latitude) {
      showToast('该客户未录入详细地址或地址未解析，请先编辑补全', 'warning');
      return;
    }
    setRouteTarget(customer);
    setRoutePlanning(true);
    setRouteModalOpen(true);
    setRouteResult(null);

    Taro.showLoading({ title: '规划路线中...', mask: true });
    try {
      const startPos = await getCurrentLocation();
      if (!startPos) {
        const fallback: RoutePlanResult = {
          success: false,
          message: '获取当前位置失败，请检查定位权限后重试',
          distance: 0, distanceKm: '0', duration: 0, durationMin: '0',
          direction: '未知', hasHighway: false, trafficLights: 0, tolls: 0,
          strategy: '', startName: '我的位置', endName: customer.name,
          origin: '', destination: `${customer.address.longitude},${customer.address.latitude}`
        };
        setRouteResult(fallback);
        return;
      }

      const result = await drivingRoute(
        startPos.longitude, startPos.latitude,
        customer.address.longitude, customer.address.latitude,
        '我的位置',
        customer.address.fullAddress || customer.community || customer.name
      );
      setRouteResult(result);
      if (result.success) {
        addHistory('导航规划', `前往「${customer.name}」：${result.distanceKm}公里 / ${result.durationMin}分钟 / ${result.direction}`);
      }
    } finally {
      setRoutePlanning(false);
      Taro.hideLoading();
    }
  };

  /**
   * 打开外部地图进行实际导航
   */
  const handleOpenMap = async () => {
    if (!routeTarget || !routeTarget.address) return;
    await openNavigation(routeTarget.address, routeTarget.name);
  };

  /**
   * 关闭导航弹窗
   */
  const closeRouteModal = () => {
    setRouteModalOpen(false);
    setRouteResult(null);
    setRouteTarget(null);
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }

    return (
      <View className={styles.pagination}>
        <Button 
          className={styles.pageBtn} 
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(1)}
        >
          <Text>首页</Text>
        </Button>
        <Button 
          className={styles.pageBtn} 
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(currentPage - 1)}
        >
          <Text>上一页</Text>
        </Button>
        {pages.map(page => (
          <Button 
            key={page}
            className={`${styles.pageBtn} ${currentPage === page ? styles.active : ''}`}
            onClick={() => setCurrentPage(page)}
          >
            <Text>{page}</Text>
          </Button>
        ))}
        <Button 
          className={styles.pageBtn} 
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage(currentPage + 1)}
        >
          <Text>下一页</Text>
        </Button>
        <Button 
          className={styles.pageBtn} 
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage(totalPages)}
        >
          <Text>末页</Text>
        </Button>
      </View>
    );
  };

  return (
    <ScrollView className={styles.container} scrollY>
      <View className={styles.headerSection}>
        <View className={styles.headerBg}></View>
        <View className={styles.headerContent}>
          <View className={styles.mainTitle}>
            <Text>用心守护你的平安保单</Text>
          </View>
          <View className={styles.subTitle}>
            <Text>一站式管理全部保障资料</Text>
          </View>
          <View className={styles.headerDecoration}>
            <View className={`${styles.decoCircle} ${styles.decoCircle1}`}></View>
            <View className={`${styles.decoCircle} ${styles.decoCircle2}`}></View>
            <View className={`${styles.decoCircle} ${styles.decoCircle3}`}></View>
          </View>
        </View>
      </View>

      <View className={styles.searchBox}>
        <Input 
          className={styles.searchInput}
          placeholder="搜索姓名、电话、小区..."
          value={searchKeyword}
          onInput={(e) => setSearchKeyword(e.detail.value)}
          confirmType="search"
          onConfirm={handleSearch}
        />
        <Button className={styles.searchBtn} onClick={handleSearch}>
          <Text>搜索</Text>
        </Button>
      </View>

      <View className={styles.filterRow}>
        <Picker 
          mode="selector" 
          range={['全部小区', ...communities]}
          value={communities.indexOf(filterCommunity) + 1}
          onChange={(e) => {
            const idx = e.detail.value;
            setFilterCommunity(idx === 0 ? '' : communities[idx - 1]);
            setCurrentPage(1);
          }}
        >
          <View className={styles.filterSelect}>
            <Text>{filterCommunity || '全部小区'}</Text>
          </View>
        </Picker>
        <Picker 
          mode="selector" 
          range={['全部性别', '男', '女']}
          value={filterGender === '男' ? 1 : filterGender === '女' ? 2 : 0}
          onChange={(e) => {
            const values = ['', '男', '女'];
            setFilterGender(values[e.detail.value]);
            setCurrentPage(1);
          }}
        >
          <View className={styles.filterSelect}>
            <Text>{filterGender || '全部性别'}</Text>
          </View>
        </Picker>
      </View>

      {pageData.length === 0 ? (
        <View className={styles.emptyTip}>
          <Text>暂无数据</Text>
        </View>
      ) : (
        pageData.map(customer => (
          <View key={customer.id} className={styles.card}>
            <View className={styles.cardHeader}>
              <View className={styles.nameRow}>
                <Text className={styles.name}>{customer.name}</Text>
                <Text className={styles.gender}>{customer.gender}</Text>
              </View>
              <Text className={styles.seq}>#{customer.seq}</Text>
            </View>

            <View className={styles.infoRow}>
              <View className={styles.infoItem}>
                <Text className={styles.infoLabel}>年龄</Text>
                <Text className={styles.infoValue}>{customer.age}</Text>
              </View>
              <View className={styles.infoItem}>
                <Text className={styles.infoLabel}>小区</Text>
                <Text className={styles.infoValue}>{customer.community}</Text>
              </View>
              <View className={styles.infoItem}>
                <Text className={styles.infoLabel}>电话</Text>
                <Text className={styles.infoValue}>{customer.phone}</Text>
              </View>
            </View>

            {customer.insured && customer.insured.name && (
              <View className={styles.infoRow}>
                <View className={styles.infoItem}>
                  <Text className={styles.infoLabel}>被保人</Text>
                  <Text className={styles.infoValue}>{customer.insured.name}</Text>
                </View>
                <View className={styles.infoItem}>
                  <Text className={styles.infoLabel}>年龄</Text>
                  <Text className={styles.infoValue}>{customer.insured.age}</Text>
                </View>
              </View>
            )}

            {customer.address && customer.address.fullAddress && (
              <View className={styles.addressLine}>
                <Text className={styles.addressIcon}>📍</Text>
                <Text className={styles.addressText}>
                  {customer.address.fullAddress}
                  {customer.address.longitude && customer.address.latitude
                    ? '  ✓已解析' : '  ⚠未解析'}
                </Text>
              </View>
            )}

            {customer.insuranceTypes && customer.insuranceTypes.length > 0 && (
              <View className={styles.insuranceTags}>
                {customer.insuranceTypes.map((type, idx) => (
                  <Text key={idx} className={styles.insuranceTag}>{type}</Text>
                ))}
              </View>
            )}

            <View className={styles.visitCount}>
              <Text>约访 {customer.visits ? customer.visits.length : 0} 次</Text>
            </View>

            <View className={styles.actionBtns}>
              <Button className={`${styles.btn} ${styles.btnNav}`} onClick={() => handleNavigate(customer)}>
                <Text>🧭 导航</Text>
              </Button>
              <Button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => handleEdit(customer)}>
                <Text>编辑</Text>
              </Button>
              <Button className={`${styles.btn} ${styles.btnDanger}`} onClick={() => handleDelete(customer)}>
                <Text>删除</Text>
              </Button>
            </View>
          </View>
        ))
      )}

      {renderPagination()}

      {/* 导航规划结果弹窗 */}
      {routeModalOpen && (
        <View className={styles.routeMask} onClick={closeRouteModal}>
          <View className={styles.routeModal} onClick={(e) => e.stopPropagation()}>
            <View className={styles.routeModalHeader}>
              <Text className={styles.routeModalTitle}>🧭 导航规划结果</Text>
              <Button className={styles.routeCloseBtn} onClick={closeRouteModal}>
                <Text>✕</Text>
              </Button>
            </View>

            <View className={styles.routeModalBody}>
              {routePlanning ? (
                <View className={styles.routeLoading}>
                  <Text className={styles.routeLoadingText}>正在获取位置并规划路线...</Text>
                  <Text className={styles.routeLoadingSub}>请保持网络畅通，建议开启定位</Text>
                </View>
              ) : routeResult ? (
                routeResult.success ? (
                  <View>
                    <View className={styles.routeTargetBox}>
                      <Text className={styles.routeTargetLabel}>目的地</Text>
                      <Text className={styles.routeTargetName}>
                        {routeTarget ? routeTarget.name : ''}（{routeResult.endName}）
                      </Text>
                    </View>

                    <View className={styles.routeHeroBox}>
                      <View className={styles.routeHeroItem}>
                        <Text className={styles.routeHeroValue}>{routeResult.distanceKm}</Text>
                        <Text className={styles.routeHeroUnit}>公里</Text>
                        <Text className={styles.routeHeroLabel}>总距离</Text>
                      </View>
                      <View className={styles.routeHeroDivider}></View>
                      <View className={styles.routeHeroItem}>
                        <Text className={styles.routeHeroValue}>{routeResult.durationMin}</Text>
                        <Text className={styles.routeHeroUnit}>分钟</Text>
                        <Text className={styles.routeHeroLabel}>预计驾驶</Text>
                      </View>
                      <View className={styles.routeHeroDivider}></View>
                      <View className={styles.routeHeroItem}>
                        <Text className={styles.routeHeroValue}>{routeResult.direction}</Text>
                        <Text className={styles.routeHeroUnit}></Text>
                        <Text className={styles.routeHeroLabel}>所在方向</Text>
                      </View>
                    </View>

                    <View className={styles.routeDetailList}>
                      <View className={styles.routeDetailItem}>
                        <Text className={styles.routeDetailIcon}>🛣️</Text>
                        <Text className={styles.routeDetailLabel}>是否上高速</Text>
                        <Text className={`${styles.routeDetailValue} ${routeResult.hasHighway ? styles.valueWarn : styles.valueOk}`}>
                          {routeResult.hasHighway ? '是（含高速/快速路）' : '否（无高速路段）'}
                        </Text>
                      </View>
                      <View className={styles.routeDetailItem}>
                        <Text className={styles.routeDetailIcon}>🚦</Text>
                        <Text className={styles.routeDetailLabel}>红绿灯数量</Text>
                        <Text className={styles.routeDetailValue}>{routeResult.trafficLights} 个</Text>
                      </View>
                      <View className={styles.routeDetailItem}>
                        <Text className={styles.routeDetailIcon}>💰</Text>
                        <Text className={styles.routeDetailLabel}>过路费</Text>
                        <Text className={styles.routeDetailValue}>
                          {routeResult.tolls > 0 ? `${routeResult.tolls} 元` : '免费'}
                        </Text>
                      </View>
                      <View className={styles.routeDetailItem}>
                        <Text className={styles.routeDetailIcon}>📌</Text>
                        <Text className={styles.routeDetailLabel}>路线策略</Text>
                        <Text className={styles.routeDetailValue}>{routeResult.strategy}</Text>
                      </View>
                      <View className={styles.routeDetailItem}>
                        <Text className={styles.routeDetailIcon}>📍</Text>
                        <Text className={styles.routeDetailLabel}>目的地坐标</Text>
                        <Text className={styles.routeDetailValue} style={{ fontSize: '20rpx' }}>
                          {routeResult.destination}
                        </Text>
                      </View>
                    </View>

                    <View className={styles.routeTipBox}>
                      <Text className={styles.routeTipText}>
                        💡 提示：距离目的地约 {routeResult.distanceKm} 公里，预计驾驶 {routeResult.durationMin} 分钟，
                        目的地在你的{routeResult.direction}，
                        {routeResult.hasHighway ? '此路线会经过高速路段' : '此路线不上高速'}，
                        途经约 {routeResult.trafficLights} 个红绿灯
                        {routeResult.tolls > 0 ? `，过路费约 ${routeResult.tolls} 元` : ''}。
                      </Text>
                    </View>

                    <View className={styles.routeActionBtns}>
                      <Button className={`${styles.btn} ${styles.btnStartNav}`} onClick={handleOpenMap}>
                        <Text>🚗 开始导航</Text>
                      </Button>
                      <Button className={`${styles.btn} ${styles.btnNeutral}`} onClick={closeRouteModal}>
                        <Text>关闭</Text>
                      </Button>
                    </View>
                  </View>
                ) : (
                  <View className={styles.routeError}>
                    <Text className={styles.routeErrorIcon}>⚠️</Text>
                    <Text className={styles.routeErrorText}>{routeResult.message}</Text>
                    <Button className={`${styles.btn} ${styles.btnNeutral}`} onClick={closeRouteModal}>
                      <Text>关闭</Text>
                    </Button>
                  </View>
                )
              ) : null}
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
}