/**
 * 多模态审核弹窗报告模块
 * 依赖: ECharts 5.4.3+
 * 使用方法: 确保页面已引入 ECharts，然后调用 initMultimodalReport()
 */

(function(global) {
    'use strict';

    // 模块状态
    let chartInstance = null;
    let modalMask = null;
    let chartDom = null;
    let isInitialized = false;

    // 默认配置
    const DEFAULT_CONFIG = {
        // 图表容器ID
        chartContainerId: 'reportChart',
        // 弹窗遮罩ID (如果是弹窗模式)
        modalMaskId: 'modalMask',
        // 是否使用弹窗模式 (false则为常驻右侧面板)
        useModal: true,
        // 数据更新回调 (可用于从后端获取数据)
        dataProvider: null,
        // 刷新间隔 (毫秒，0表示不自动刷新)
        autoRefreshInterval: 0
    };

    let config = { ...DEFAULT_CONFIG };

    // ========== 核心数据模型 ==========
    
    /**
     * 获取报告数据 (可被外部覆盖)
     * @returns {Object} 包含 screen, audio, subtitle, total 的报告数据
     */
   function fetchReportData() {
    // 从 sessionStorage 读取最新审核结果
    try {
        const cached = sessionStorage.getItem('latestAuditResult');
        if (cached) {
            const data = JSON.parse(cached);
            // 5分钟内有效
            if (Date.now() - data.timestamp < 5 * 60 * 1000) {
                return {
                    screen: data.screen || 0,
                    subtitle: data.subtitle || 0,
                    total: data.total || 0
                };
            }
        }
    } catch (err) {
        console.warn('读取缓存失败:', err);
    }
    
    // 默认数据
    return {
        screen: 0,
        subtitle: 0,
        total: 0
    };
}

    /**
     * 标准化数据格式
     */
    function normalizeData(data) {
    const screen = data.screen ?? data.screenScore ?? data.quality_score ?? 0;
    const subtitle = data.subtitle ?? data.subtitleScore ?? data.theme_score ?? 0;
    const total = data.total ?? data.totalScore ?? data.score ?? Math.round((screen + subtitle) / 2);
    
    return { screen, subtitle, total };
}
    // ========== 图表渲染 ==========

    /**
     * 生成 ECharts 配置
     */
    function generateChartOption(data) {
    const { screen, subtitle, total } = data;  // ← 去掉 audio

    return {
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            backgroundColor: '#0b1a2f',
            borderColor: '#2a6df4',
            borderWidth: 1,
            textStyle: { color: '#e2f0ff', fontSize: 13 },
            formatter: function(params) {
                return `<b>${params[0].name}</b><br/>📈 得分: ${params[0].value} 分`;
            }
        },
        grid: {
            left: '12%',
            right: '8%',
            top: '22%',
            bottom: '14%',
            containLabel: false
        },
        xAxis: {
            type: 'category',
            data: ['画面质量', '文字主题', '综合评分'],  // ← 改成三项
            axisLabel: {
                color: '#c6e2ff',
                fontSize: 13,
                fontWeight: '500',
                margin: 12,
                textShadow: '0 0 6px #1e62a0'
            },
            axisLine: {
                lineStyle: { color: '#2a5285', width: 2 }
            },
            axisTick: { show: false }
        },
        yAxis: {
            type: 'value',
            min: 0,
            max: 100,
            splitNumber: 5,
            axisLabel: {
                color: '#b0c9f0',
                fontSize: 12,
                formatter: '{value} 分'
            },
            splitLine: {
                lineStyle: {
                    color: '#1e3752',
                    type: 'dashed',
                    opacity: 0.5
                }
            },
            axisLine: { show: false },
            axisTick: { show: false }
        },
        series: [
            {
                name: '得分',
                type: 'bar',
                data: [screen, subtitle, total],  // ← 三个数据
                barWidth: 48,
                itemStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: '#4fc7ff' },
                        { offset: 0.7, color: '#2a6df4' },
                        { offset: 1, color: '#1a4bbf' }
                    ]),
                    borderRadius: [8, 8, 0, 0],
                    borderColor: '#8ecaff',
                    borderWidth: 0.8,
                    shadowColor: '#3b7cff80',
                    shadowBlur: 12,
                    shadowOffsetY: 3
                },
                label: {
                    show: true,
                    position: 'top',
                    color: '#d6ecff',
                    fontSize: 14,
                    fontWeight: 'bold',
                    textShadow: '0 2px 6px #0a1a2f',
                    formatter: (params) => params.value + '%',
                    offset: [0, 4]
                },
                showBackground: true,
                backgroundStyle: {
                    color: 'rgba(30, 60, 100, 0.25)',
                    borderRadius: [8, 8, 0, 0],
                    borderColor: '#1e4268'
                }
            },
            {
                type: 'line',
                markLine: {
                    silent: true,
                    symbol: 'none',
                    lineStyle: {
                        color: '#f9c74f',
                        type: 'dashed',
                        width: 2,
                        opacity: 0.7
                    },
                    data: [{ yAxis: 85, name: '优秀线 85%' }],
                    label: {
                        show: true,
                        position: 'end',
                        color: '#f9c74f',
                        fontSize: 12,
                        fontWeight: 'bold',
                        backgroundColor: '#0f1a28',
                        padding: [2, 8, 2, 8],
                        borderRadius: 20,
                        borderColor: '#f9c74f',
                        borderWidth: 1,
                        formatter: '优质基准 85'
                    }
                },
                data: []
            }
        ],
        textStyle: {
            color: '#ffffff',
            fontFamily: 'Microsoft YaHei, sans-serif'
        }
    };
}
    /**
     * 渲染或更新图表
     */
    function renderChart(data) {
        if (!chartDom) {
            chartDom = document.getElementById(config.chartContainerId);
        }
        
        if (!chartDom) {
            console.warn('[多模态报告] 找不到图表容器:', config.chartContainerId);
            return false;
        }

        const normalizedData = normalizeData(data);

        // 初始化或复用实例
        if (!chartInstance) {
            chartInstance = echarts.init(chartDom);
        }

        const option = generateChartOption(normalizedData);
        chartInstance.setOption(option, { notMerge: false });
        
        // 触发数据更新事件 (供外部监听)
        triggerEvent('dataUpdated', normalizedData);
        
        return true;
    }

    /**
     * 更新页面上的数字卡片 (如果有)
     */
    function updateMetricCards(data) {
    const { screen, subtitle, total } = normalizeData(data);
    
    const elements = {
        screenScore: document.getElementById('screenScore'),
        subtitleScore: document.getElementById('subtitleScore'),
        totalScore: document.getElementById('totalScore')
    };
    
    if (elements.screenScore) elements.screenScore.textContent = screen;
    if (elements.subtitleScore) elements.subtitleScore.textContent = subtitle;
    if (elements.totalScore) elements.totalScore.textContent = total;
}

    // ========== 弹窗控制 ==========

    /**
     * 打开弹窗并渲染报告
     */
    function openModal() {
        if (!modalMask) {
            modalMask = document.getElementById(config.modalMaskId);
        }
        
        if (modalMask) {
            modalMask.style.display = 'flex';
        }
        
        // 延迟渲染确保容器尺寸正确
        setTimeout(() => {
            const data = fetchReportData();
            renderChart(data);
            updateMetricCards(data);
            
            if (chartInstance) {
                chartInstance.resize();
            }
        }, 20);
        
        triggerEvent('opened');
    }

    /**
     * 关闭弹窗
     */
    function closeModal() {
        if (modalMask) {
            modalMask.style.display = 'none';
        }
        triggerEvent('closed');
    }

    /**
     * 切换弹窗显示状态
     */
    function toggleModal() {
        if (!modalMask) {
            modalMask = document.getElementById(config.modalMaskId);
        }
        
        if (modalMask && modalMask.style.display === 'flex') {
            closeModal();
        } else {
            openModal();
        }
    }

    // ========== 常驻面板模式 ==========

    /**
     * 刷新报告数据 (适用于常驻右侧面板)
     */
    function refreshReport() {
        const data = fetchReportData();
        renderChart(data);
        updateMetricCards(data);
        triggerEvent('refreshed', data);
        return data;
    }

    // ========== 事件系统 ==========

    const eventListeners = {
        opened: [],
        closed: [],
        dataUpdated: [],
        refreshed: []
    };

    function triggerEvent(eventName, data) {
        if (eventListeners[eventName]) {
            eventListeners[eventName].forEach(callback => {
                try {
                    callback(data);
                } catch (e) {
                    console.error(`[多模态报告] 事件 ${eventName} 回调执行错误:`, e);
                }
            });
        }
    }

    function on(eventName, callback) {
        if (eventListeners[eventName] && typeof callback === 'function') {
            eventListeners[eventName].push(callback);
        }
    }

    function off(eventName, callback) {
        if (eventListeners[eventName]) {
            const index = eventListeners[eventName].indexOf(callback);
            if (index > -1) {
                eventListeners[eventName].splice(index, 1);
            }
        }
    }

    // ========== 初始化和销毁 ==========

    /**
     * 绑定弹窗事件
     */
    function bindModalEvents() {
        if (!modalMask) {
            modalMask = document.getElementById(config.modalMaskId);
        }
        
        if (modalMask) {
            // 点击遮罩关闭
            modalMask.addEventListener('click', function(e) {
                if (e.target === modalMask) {
                    closeModal();
                }
            });
        }

        // ESC 键关闭
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && modalMask && modalMask.style.display === 'flex') {
                closeModal();
            }
        });

        // 窗口大小变化时重绘
        window.addEventListener('resize', function() {
            if (chartInstance) {
                const isVisible = !config.useModal || (modalMask && modalMask.style.display === 'flex');
                if (isVisible || !config.useModal) {
                    chartInstance.resize();
                }
            }
        });
    }

    /**
     * 初始化模块
     * @param {Object} options 配置选项
     */
    function init(options = {}) {
        if (isInitialized) {
            console.warn('[多模态报告] 模块已初始化，将使用新配置重新初始化');
            destroy();
        }

        // 合并配置
        config = { ...DEFAULT_CONFIG, ...options };
        
        // 获取DOM元素
        chartDom = document.getElementById(config.chartContainerId);
        modalMask = document.getElementById(config.modalMaskId);
        
        // 绑定事件
        bindModalEvents();
        
        // 如果是常驻面板模式，立即渲染
        if (!config.useModal && chartDom) {
            setTimeout(() => {
                refreshReport();
            }, 50);
        }
        
        // 自动刷新
        if (config.autoRefreshInterval > 0) {
            startAutoRefresh();
        }
        
        isInitialized = true;
        triggerEvent('initialized', { config });
        
        console.log('[多模态报告] 初始化完成', config);
        return API;
    }

    let autoRefreshTimer = null;

    function startAutoRefresh() {
        stopAutoRefresh();
        if (config.autoRefreshInterval > 0) {
            autoRefreshTimer = setInterval(() => {
                refreshReport();
            }, config.autoRefreshInterval);
        }
    }

    function stopAutoRefresh() {
        if (autoRefreshTimer) {
            clearInterval(autoRefreshTimer);
            autoRefreshTimer = null;
        }
    }

    /**
     * 销毁模块
     */
    function destroy() {
        stopAutoRefresh();
        
        if (chartInstance) {
            chartInstance.dispose();
            chartInstance = null;
        }
        
        // 清空事件监听
        Object.keys(eventListeners).forEach(key => {
            eventListeners[key] = [];
        });
        
        isInitialized = false;
        chartDom = null;
        modalMask = null;
        
        console.log('[多模态报告] 已销毁');
    }

    /**
     * 手动调整图表尺寸
     */
    function resize() {
        if (chartInstance) {
            chartInstance.resize();
        }
    }

    /**
     * 获取当前图表实例
     */
    function getChartInstance() {
        return chartInstance;
    }

    /**
     * 设置自定义数据提供器
     */
    function setDataProvider(provider) {
        if (typeof provider === 'function') {
            config.dataProvider = provider;
        }
    }

    // ========== 公开 API ==========
    const API = {
        init,
        open: openModal,
        close: closeModal,
        toggle: toggleModal,
        refresh: refreshReport,
        render: renderChart,
        updateCards: updateMetricCards,
        resize,
        destroy,
        on,
        off,
        getChartInstance,
        setDataProvider,
        startAutoRefresh,
        stopAutoRefresh,
        // 版本信息
        version: '1.0.0'
    };

    // 挂载到全局
    global.MultimodalReport = API;

    // 如果使用 CommonJS/AMD
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = API;
    }

})(window);