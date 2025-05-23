import '../styles/globals.css'
import { useEffect, useState } from 'react'
import Head from 'next/head'

export default function App({ Component, pageProps }) {
  const [siteInfo, setSiteInfo] = useState({ title: '', domain: '' })

  useEffect(() => {
    fetch('/api/info')
      .then(r => r.json())
      .then(setSiteInfo)
  }, [])

  return (
    <>
      <Head>
        <title>{siteInfo.title}</title>
      </Head>
      <Component {...pageProps} siteTitle={siteInfo.title} domain={siteInfo.domain} />
    </>
  )
}
