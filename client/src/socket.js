import { io } from 'socket.io-client'

const url = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'
export const socket = io(url, { autoConnect: true })
