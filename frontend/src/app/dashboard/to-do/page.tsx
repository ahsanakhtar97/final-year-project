"use client"
import React, { useState } from 'react'


const ToDoPage = () => {
    const [Tasks,setTasks]=useState([]);
    return (
    <div>
        <div style={styles.kanBanContainer}>
            <ul style={styles.boardsContainer}>
                <li style={styles.board}><span>To Do</span></li>
                <li style={styles.board}><span>In Progress</span></li>
                <li style={styles.board}><span>Completed</span></li>
            </ul>
        </div>
    </div>
  )
}
const styles:Record<string,React.CSSProperties>={
    kanBanContainer:{
        background:'#f5f5f5',
        width:'100%',
        height:'100%',
    },
    boardsContainer:{
        gap:'10px',
        listStyle:'none',
        display:'flex',
        flexDirection:'row',
        justifyContent:'space-evenly'
    },
    board:{
        gap:'5px',
        padding:'10px'
    }
}

export default ToDoPage;