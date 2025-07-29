import React from 'react'
import Spinner from '/src/assets/spinner.gif'

export default function Loading() {
  return (
    <div className="text-center">
      <img src={Spinner} style={{height: '75px'}} alt="loading" />
    </div>
  )
}
