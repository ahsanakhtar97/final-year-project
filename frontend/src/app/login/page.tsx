import {useState} from 'react'
export default function Login(){
    const [email,setEmail]=useState("");
    const [password,setPassword]=useState("");
    async function handleLogin(e:React.FormEvent<HTMLFormElement>){
        e.preventDefault();
        console.log('Form submitted');
        console.log({email,password});
    }
    return (
        <form onSubmit={handleLogin}>
            <input type='email' placeholder='Enter your email' value={email} onChange={(e)=>setEmail(e.target.value)}></input>
            <input type='password' placeholder='Enter your password' value={password} onChange={(e)=>setPassword(e.target.value)}></input>
            <button type='submit'>Submit</button>

        </form>
    )

}