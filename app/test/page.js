'use client'

import { useState } from 'react'

export default function DragTest() {
  const [dragStatus, setDragStatus] = useState('Not dragging')
  const [dropZone, setDropZone] = useState('Nothing dropped yet')
  const [events, setEvents] = useState([])

  const addEvent = (event) => {
    setEvents(prev => [...prev.slice(-9), event])
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Drag and Drop Test</h1>
      
      {/* Test 1: Basic HTML5 Drag */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-2">Test 1: Basic HTML5 Drag</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="border-2 border-blue-500 p-4">
            <div
              draggable="true"
              onDragStart={() => {
                setDragStatus('Dragging!')
                addEvent('dragStart')
              }}
              onDragEnd={() => {
                setDragStatus('Drag ended')
                addEvent('dragEnd')
              }}
              className="bg-blue-500 text-white p-4 rounded cursor-move"
            >
              DRAG ME (Basic)
            </div>
          </div>
          
          <div
            onDragOver={(e) => {
              e.preventDefault()
              addEvent('dragOver')
            }}
            onDrop={(e) => {
              e.preventDefault()
              setDropZone('Dropped!')
              addEvent('drop')
            }}
            className="border-2 border-green-500 p-4 min-h-[100px]"
          >
            DROP HERE
            <div className="text-sm mt-2">{dropZone}</div>
          </div>
        </div>
        <div className="mt-2 text-sm">Status: {dragStatus}</div>
      </div>

      {/* Test 2: Different draggable syntax */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-2">Test 2: Different Draggable Syntax</h2>
        <div className="space-y-2">
          <div
            draggable={true}
            onDragStart={() => addEvent('test2-dragStart')}
            className="bg-purple-500 text-white p-4 rounded inline-block cursor-move"
          >
            Draggable={true} (boolean)
          </div>
          
          <div
            draggable
            onDragStart={() => addEvent('test3-dragStart')}
            className="bg-pink-500 text-white p-4 rounded inline-block cursor-move ml-4"
          >
            Draggable (no value)
          </div>
        </div>
      </div>

      {/* Test 3: Mouse events fallback */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-2">Test 3: Mouse Events (Fallback)</h2>
        <div
          onMouseDown={() => addEvent('mouseDown')}
          onMouseMove={() => addEvent('mouseMove')}
          onMouseUp={() => addEvent('mouseUp')}
          className="bg-orange-500 text-white p-4 rounded inline-block cursor-move"
        >
          Test Mouse Events
        </div>
      </div>

      {/* Event Log */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-2">Event Log:</h2>
        <div className="bg-gray-100 p-4 rounded h-48 overflow-y-auto font-mono text-sm">
          {events.length === 0 ? 'No events yet...' : events.map((e, i) => (
            <div key={i}>{e}</div>
          ))}
        </div>
      </div>

      {/* Browser Info */}
      <div className="mt-4 text-sm text-gray-600">
        <div>User Agent: {typeof window !== 'undefined' && window.navigator.userAgent}</div>
      </div>
    </div>
  )
}