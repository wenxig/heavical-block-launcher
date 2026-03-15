import { PiniaColada } from '@pinia/colada'
import { useDark, usePreferredDark } from '@vueuse/core'
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

    const primaryColor = Color('#177cb0')
    const primaryColorLighten = Color(primaryColor).lighten(0.2)
    const primaryColorDarken = Color(primaryColor).darken(0.2)

    return () => (
      <NConfigProvider
        locale={zhCN}
        abstract
        theme={isDark.value ? darkTheme : undefined}
        themeOverrides={{
          common: {
            primaryColor: primaryColor.hex(),
            primaryColorHover: primaryColorDarken.hex(),
            primaryColorPressed: primaryColorLighten.hex(),
            primaryColorSuppl: primaryColorLighten.hex(),
            cardColor: isDark.value ? '#17181a' : undefined
          }
        }}
      >
        <NGlobalStyle />
        <NLoadingBarProvider>
          <NDialogProvider>
            <NMessageProvider>
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

app.use(DataLoaderPlugin, { router })
app.use(router)

const meta = document.createElement('meta')
meta.name = 'naive-ui-style'
document.head.appendChild(meta)

app.mount('#app')