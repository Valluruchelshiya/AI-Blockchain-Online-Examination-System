import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";

export default function AdminProctoring() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const socket = io(import.meta.env.VITE_API_BASE || "http://localhost:5000", {
      path: "/socket.io",
      transports: ["websocket"]
    });

    socket.on("proctor_event", (payload) => {
      setEvents((prev) => [payload, ...prev].slice(0, 50));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div>
      <h2>Live Proctoring Events</h2>
      <table className="table">
        <thead>
          <tr>
            <th>Attempt ID</th>
            <th>Event</th>
            <th>Details</th>
            <th>Suspicion Score</th>
          </tr>
        </thead>
        <tbody>
          {events.map((e, idx) => (
            <tr key={idx}>
              <td>{e.attempt_id}</td>
              <td>{e.event_type}</td>
              <td><pre>{JSON.stringify(e.event_details)}</pre></td>
              <td>{e.suspicion_score}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
