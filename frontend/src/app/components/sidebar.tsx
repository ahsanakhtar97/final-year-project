"use client";
import { useRouter } from 'next/navigation';
import { useEffect, useState} from "react";
import {
  LayoutDashboard,
  User,
  LogOut,
  CheckSquare
} from "lucide-react";
import Link from "next/link";
import { jwtDecode } from 'jwt-decode';

export default function Sidebar() {
    function getToken():string|null{
        const token=localStorage.getItem('accessToken');
        if(token)
        return token;
    return null;
    }
    function getpayload(token:string|null){
        if(token){
        const data=jwtDecode(token);
        return data;
        }
    }
    const router=useRouter();
  const [open, setOpen] = useState(true);
  const [user,setUser]=useState({name:"",email:""})
  function handleLogout(){
          localStorage.removeItem('accessToken');
          router.push('/login');
      }
      useEffect(()=>{
        const t=getToken();
        const pl=getpayload(t);
        console.log(pl);
        setUser(prev=>({
            ...prev,...pl
        }));
      },[])
  return (

    <>
      <aside style={styles.sidebar}>
        <h2 style={styles.heading}> Welcome, {user.name}</h2>
        <ul style={styles.menu}>
            <li style={styles.menuItem}>
                <Link href='/dashboard' style={styles.linkStyle}>
                <LayoutDashboard size={20}/>
                <span>Dashboard</span>
                </Link>
            </li>
            <li style={styles.menuItem}>
                <Link href='/dashboard/to-do' style={styles.linkStyle}>
                <CheckSquare size={20}/>
                <span>To Do List</span>
                </Link>
            </li>
            <li style={styles.menuItem}>
                <Link href='/dashboard/profile' style={styles.linkStyle}>
                <User size={20}/>
                <span>Profile</span>
                </Link>
            </li>
        </ul>
        <div style={styles.menuItem}>
            <LogOut size={20}/>
        <button style={styles.logoutBtnStyle} onClick={handleLogout}>
            Logout
        </button>
      </div>
      </aside>
      
    </>
  );
}
const styles:Record<string,React.CSSProperties>={
    sidebar:{
        width:'220px',
        minHeight:'100vh',
        backgroundColor:'#f5f5f5',
        padding:'20px',
        boxSizing:'border-box'
    },
    heading:{
        fontSize:'20px',
        fontWeight:'bold',
        marginBottom:'30px'
    },
    menu:{
        listStyle:'none',
        padding:0,
        margin:0
    },
    menuItem:{
        display:'flex',
        alignItems:'center',
        gap:'10px',
        padding:'10px 0',
        cursor:'pointer'
    },
    logoutBtnStyle:{
        fontSize:'16px',
        border:'none',
        outline:'none',
        backgroundColor:'#f5f5f5',
        cursor:'pointer'
    },
    linkStyle:{
        textDecoration:'none',
        display:'flex',
        color:'black',
        gap:'10px'
    }

}
