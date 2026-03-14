import { PiniaColada } from '@pinia/colada'
import { useDark, usePreferredDark } from '@vueuse/core'

import '@/index.css'
import Color from 'color'
import {
  NConfigProvider,
  NMessageProvider,
  NDialogProvider,
  NLoadingBarProvider,
  zhCN,
  darkTheme,
  NGlobalStyle
} from 'naive-ui'
import { createPinia } from 'pinia'
import { createApp, defineComponent, watch } from 'vue'
import { DataLoaderPlugin } from 'vue-router/experimental'

import App from './App.vue'
import { router } from './router'

const app = createApp(
  defineComponent(() => {
    const isDark = usePreferredDark()
    const isUseDarkMode = useDark({ listenToStorageChanges: false })
    watch(isDark, isDark => (isUseDarkMode.value = isDark), { immediate: true })

    const themeColor = Color('#0087bd').hex()
    const themeColorDark = Color(themeColor).darken(0.2).hex()

    return () => (
      <NConfigProvider
        locale={zhCN}
        abstract
        theme={isDark.value ? darkTheme : undefined}
        themeOverrides={{
          common: {
            primaryColor: themeColor,
            primaryColorHover: Color(themeColor).lighten(0.2).hex(),
            primaryColorPressed: themeColorDark,
            primaryColorSuppl: themeColorDark,
            cardColor: isDark.value ? '#17181a' : undefined
          }
        }}
      >
        <NGlobalStyle />
        <NLoadingBarProvider container-class='z-200000'>
          <NDialogProvider to='#popups'>
            <NMessageProvider max={5} to='#messages'>
              <App />
            </NMessageProvider>
          </NDialogProvider>
        </NLoadingBarProvider>
      </NConfigProvider>
    )
  })
)

app.use(createPinia())
app.use(PiniaColada)

// @ts-ignore
app.use(DataLoaderPlugin, { router })
app.use(router)

const meta = document.createElement('meta')
meta.name = 'naive-ui-style'
document.head.appendChild(meta)

app.mount('#app')