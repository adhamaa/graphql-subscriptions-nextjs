'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as React from 'react'

const gqlUrl = 'http://localhost:4000/graphql'
const wsUrl = 'ws://localhost:4000/graphql'


const GET_CURRENT_COUNT = `
      query {
        currentNumber
      }
    `
const SET_COUNTER_UPDATE = `
      mutation CounterMutation($type: String) {
        updateNumber(type: $type)
      }
    `
const COUNTER_SUBSCRIPTION = `
      subscription CounterSubscription {
        updatedNumber
      }
    `

function requestOptions(query: string, variables?: any) {
  return {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables })
  }
}

export const getCurrentCount = () =>
  fetch(gqlUrl, requestOptions(GET_CURRENT_COUNT))
    .then((res) => res.json())
    .then((data) => data.data.currentNumber)
    .catch((error) => {
      console.error('error:', error)
    });

export const setCounterUpdate = ({ type }: { type: string }) =>
  fetch(gqlUrl, requestOptions(SET_COUNTER_UPDATE, { type }))
    .catch((error) => {
      console.error('error:', error)
    });

const useReactQuerySubscription = () => {
  const queryClient = useQueryClient()
  React.useEffect(() => {
    const ws = new WebSocket(wsUrl, 'graphql-transport-ws')
    ws.onopen = () => {
      ws.send(JSON.stringify({ "type": "connection_init", "payload": {} }));
      ws.send(JSON.stringify({
        "id": "2",
        "type": "subscribe",
        "payload": {
          "variables": {},
          "extensions": {},
          "operationName": "CounterSubscription",
          "query": `subscription CounterSubscription {
            updatedNumber
          }`
        }
      }))
      console.log('Connected to websocket')
    }
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data)
      const { payload: { data: { updatedNumber = null } = {} } = {} } = msg
      queryClient.invalidateQueries({ queryKey: ['counter'] })

    }
    ws.onclose = () => {
      console.log('Disconnected from websocket')
    }
    return () => {
      ws.close()
    }

  }, [queryClient])
}


const Spinner = () => (
  <div
    className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
    role="status">
    <span
      className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]"
    >Loading...</span>
  </div>
);



function LiveQueryCounter() {
  const { data: LiveCounter } = useQuery({ queryKey: ['counter'], queryFn: getCurrentCount })
  const { mutate: setUpdateCounter } = useMutation({ mutationKey: ['counter'], mutationFn: setCounterUpdate })
  const handleIncrement = (type: string) => () => setUpdateCounter({ type })

  useReactQuerySubscription(); // run the subscription hook to listen for updates

  return (
    <>
      <div className="flex items-center justify-center space-x-4">
        <button
          onClick={handleIncrement('increment')}
          className="px-4 py-2 font-semibold text-white bg-blue-600 rounded-md"
        >
          Increment
        </button>
        <button
          onClick={handleIncrement('reset')}
          className="px-4 py-2 font-semibold text-white bg-blue-600 rounded-md"
        >
          Reset
        </button>
        <button
          onClick={handleIncrement('decrement')}
          className="px-4 py-2 font-semibold text-white bg-blue-600 rounded-md"
        >
          Decrement
        </button>
      </div>
      <div className="text-4xl font-semibold text-center p-4">{LiveCounter ?? <Spinner />}</div>
    </>
  )
}

export default LiveQueryCounter;

