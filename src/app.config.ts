export default defineAppConfig({
  pages: [
    'pages/list/index',
    'pages/add/index',
    'pages/stats/index',
    'pages/mine/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#0f172a',
    navigationBarTitleText: '用心守护',
    navigationBarTextStyle: 'white',
    backgroundColor: '#0f172a'
  },
  tabBar: {
    color: '#64748b',
    selectedColor: '#3b82f6',
    backgroundColor: '#1e293b',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/list/index',
        text: '保单列表',
        iconPath: 'assets/tabbar/list.svg',
        selectedIconPath: 'assets/tabbar/list-selected.svg'
      },
      {
        pagePath: 'pages/add/index',
        text: '录入保单',
        iconPath: 'assets/tabbar/add.svg',
        selectedIconPath: 'assets/tabbar/add-selected.svg'
      },
      {
        pagePath: 'pages/stats/index',
        text: '保障分析',
        iconPath: 'assets/tabbar/stats.svg',
        selectedIconPath: 'assets/tabbar/stats-selected.svg'
      },
      {
        pagePath: 'pages/mine/index',
        text: '我的',
        iconPath: 'assets/tabbar/mine.svg',
        selectedIconPath: 'assets/tabbar/mine-selected.svg'
      }
    ]
  }
})