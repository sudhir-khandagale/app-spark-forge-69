import { useEffect, useState } from 'react';
import { Keyboard, KeyboardInfo } from '@capacitor/keyboard';
import { Capacitor } from '@capacitor/core';

export const useKeyboard = () => {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    if (!isNative) return;

    let showHandle: any;
    let hideHandle: any;

    Keyboard.addListener('keyboardWillShow', (info: KeyboardInfo) => {
      setKeyboardHeight(info.keyboardHeight);
      setIsKeyboardVisible(true);
    }).then(handle => {
      showHandle = handle;
    });

    Keyboard.addListener('keyboardWillHide', () => {
      setKeyboardHeight(0);
      setIsKeyboardVisible(false);
    }).then(handle => {
      hideHandle = handle;
    });

    return () => {
      if (showHandle) showHandle.remove();
      if (hideHandle) hideHandle.remove();
    };
  }, [isNative]);

  const hide = async () => {
    if (!isNative) return;
    try {
      await Keyboard.hide();
    } catch (e) {
      console.log('Keyboard hide not available');
    }
  };

  return {
    keyboardHeight,
    isKeyboardVisible,
    hide,
  };
};
