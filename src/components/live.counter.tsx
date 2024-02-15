'use client'
import * as React from 'react'

const url = 'ws://localhost:4000/subscriptions'

const Spinner = () => (
  <div
    className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
    role="status">
    <span
      className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]"
    >Loading...</span>
  </div>
);

function LiveCounter() {
  const [LiveCounter, setLiveCounter] = React.useState(0)

  React.useEffect(() => {
    const ws = new WebSocket(url, 'graphql-transport-ws')
    ws.onopen = () => {
      ws.send(JSON.stringify({ "type": "connection_init", "payload": {} }));
      ws.send(JSON.stringify({
        "id": "1",
        "type": "subscribe",
        "payload": {
          "variables": {},
          "extensions": {},
          "operationName": "CounterSubscription",
          "query": `subscription CounterSubscription {
            numberIncremented
          }`
        }
      }))
      console.log('Connected to websocket')
    }
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data)
      const { payload: { data: { numberIncremented = null } = {} } = {} } = msg
      setLiveCounter(numberIncremented)
    }
    ws.onclose = () => {
      console.log('Disconnected from websocket')
    }
    return () => {
      // ws.send(JSON.stringify({ "id": "1", "type": "complete" }))
      ws.close()
    }

  }, [])

  React.useEffect(() => {
    getCurrentNumber()
  }, [])

  const getCurrentNumber = () => {
    fetch('http://localhost:4000/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: `
        query {
          currentNumber
        }
      `
      })
    })
      .then((res) => res.json())
      .then((data) => data.data.currentNumber)
      .then(setLiveCounter)
      .catch((error) => {
        console.error('error:', error)
      })
  }

  const handleIncrement = () => {
    fetch('http://localhost:4000/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: `
        mutation {
          incrementNumber
        }
      `
      })
    })
      .catch((error) => {
        console.error('error:', error)
      })
  }


  return (
    <div className="flex items-center justify-center space-x-4">
      <button
        onClick={handleIncrement}
        className="px-4 py-2 font-semibold text-white bg-blue-600 rounded-md"
      >
        Increment
      </button>
      <div className="text-4xl font-semibold">{LiveCounter ?? <Spinner />}</div>
    </div>
  )
}

export default LiveCounter;