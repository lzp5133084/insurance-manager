import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';

interface StatCardProps {
  value: string | number;
  label: string;
  color?: string;
}

export default function StatCard({ value, label, color = '#3b82f6' }: StatCardProps) {
  return (
    <View className={styles.statItem}>
      <View className={styles.statValue} style={{ color }}>
        <Text>{value}</Text>
      </View>
      <View className={styles.statLabel}>
        <Text>{label}</Text>
      </View>
    </View>
  );
}