import { reactive, ref } from 'vue';
import type { Component } from 'vue';

export type TooltipType = 'info' | 'warning' | 'error' | 'success' | 'help';
export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';
export type TooltipSize = 'sm' | 'md' | 'lg';

export interface TooltipOptions {
  content: string;
  type?: TooltipType;
  position?: TooltipPosition;
  size?: TooltipSize;
  delay?: number;
  showArrow?: boolean;
  maxWidth?: string;
  icon?: Component;
  interactive?: boolean;
}

export interface ProcessedTooltipOptions {
  content: string;
  type: TooltipType;
  position: TooltipPosition;
  size: TooltipSize;
  delay: number;
  showArrow: boolean;
  maxWidth: string;
  icon?: Component;
  interactive: boolean;
}

export interface TooltipConfig {
  defaultPosition: TooltipPosition;
  defaultDelay: number;
  defaultSize: TooltipSize;
  showArrowByDefault: boolean;
  maxWidth: string;
}

// Global tooltip configuration
const defaultConfig: TooltipConfig = {
  defaultPosition: 'top',
  defaultDelay: 200,
  defaultSize: 'md',
  showArrowByDefault: true,
  maxWidth: '200px',
};

const config = reactive<TooltipConfig>({ ...defaultConfig });

// Active tooltips tracking
const activeTooltips = ref<Set<string>>(new Set());

export function useTooltip() {
  // Generate unique tooltip ID
  const generateTooltipId = (): string => {
    return `tooltip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  // Create tooltip options with defaults
  const createTooltipOptions = (options: TooltipOptions): ProcessedTooltipOptions => {
    return {
      content: options.content,
      type: options.type ?? 'info',
      position: options.position ?? config.defaultPosition,
      size: options.size ?? config.defaultSize,
      delay: options.delay ?? config.defaultDelay,
      showArrow: options.showArrow ?? config.showArrowByDefault,
      maxWidth: options.maxWidth ?? config.maxWidth,
      icon: options.icon,
      interactive: options.interactive ?? false,
    };
  };

  // Get tooltip classes based on type
  const getTooltipClasses = (type: TooltipType, size: TooltipSize): string => {
    const baseClasses =
      'rounded-md px-3 py-2 text-xs font-medium shadow-lg border backdrop-blur-sm transition-all duration-200';

    const typeClasses = {
      info: 'bg-blue-50 text-blue-900 border-blue-200 dark:bg-blue-950 dark:text-blue-100 dark:border-blue-800',
      warning:
        'bg-yellow-50 text-yellow-900 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-100 dark:border-yellow-800',
      error:
        'bg-red-50 text-red-900 border-red-200 dark:bg-red-950 dark:text-red-100 dark:border-red-800',
      success:
        'bg-green-50 text-green-900 border-green-200 dark:bg-green-950 dark:text-green-100 dark:border-green-800',
      help: 'bg-purple-50 text-purple-900 border-purple-200 dark:bg-purple-950 dark:text-purple-100 dark:border-purple-800',
    };

    const sizeClasses = {
      sm: 'text-xs px-2 py-1',
      md: 'text-sm px-3 py-2',
      lg: 'text-base px-4 py-3',
    };

    return `${baseClasses} ${typeClasses[type]} ${sizeClasses[size]}`;
  };

  // Track tooltip state
  const registerTooltip = (id: string): void => {
    activeTooltips.value.add(id);
  };

  const unregisterTooltip = (id: string): void => {
    activeTooltips.value.delete(id);
  };

  // Configuration methods
  const setConfig = (newConfig: Partial<TooltipConfig>): void => {
    Object.assign(config, newConfig);
  };

  const resetConfig = (): void => {
    Object.assign(config, defaultConfig);
  };

  // Utility methods
  const closeAllTooltips = (): void => {
    activeTooltips.value.clear();
  };

  const getActiveTooltipCount = (): number => {
    return activeTooltips.value.size;
  };

  // Helper function for common tooltip patterns
  const createInfoTooltip = (content: string, options?: Partial<TooltipOptions>) =>
    createTooltipOptions({ ...options, content, type: 'info' });

  const createWarningTooltip = (content: string, options?: Partial<TooltipOptions>) =>
    createTooltipOptions({ ...options, content, type: 'warning' });

  const createErrorTooltip = (content: string, options?: Partial<TooltipOptions>) =>
    createTooltipOptions({ ...options, content, type: 'error' });

  const createSuccessTooltip = (content: string, options?: Partial<TooltipOptions>) =>
    createTooltipOptions({ ...options, content, type: 'success' });

  const createHelpTooltip = (content: string, options?: Partial<TooltipOptions>) =>
    createTooltipOptions({ ...options, content, type: 'help' });

  return {
    // Core functionality
    generateTooltipId,
    createTooltipOptions,
    getTooltipClasses,

    // State management
    registerTooltip,
    unregisterTooltip,
    activeTooltips,

    // Configuration
    config,
    setConfig,
    resetConfig,

    // Utilities
    closeAllTooltips,
    getActiveTooltipCount,

    // Helper methods
    createInfoTooltip,
    createWarningTooltip,
    createErrorTooltip,
    createSuccessTooltip,
    createHelpTooltip,
  };
}

export type UseTooltipReturn = ReturnType<typeof useTooltip>;
