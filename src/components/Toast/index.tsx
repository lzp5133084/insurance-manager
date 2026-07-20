import React, { useState, useEffect } from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';

interface ToastProps {
  message: string;
  type: 'success' | 'warning' | 'error';
  onClose: () => void;
}

export default function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 2500);
    return () => clearTimeout(timer);
  }, []);

  const typeStyles = {
    success: styles.success,
    warning: styles.warning,
    error: styles.error
  };

  return (
    <View className={`${styles.toast} ${typeStyles[type]}`}>
      <Text>{message}</Text>
    </View>
  );
}