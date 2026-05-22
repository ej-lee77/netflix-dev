export interface Profile{
    id: number;
    name: string|null;
    imgUrl: string|null;
}

export interface User{
    email: string|null;
    name?:string|null;
    phone?:string|null;
    profiles: Profile[]|null;
}

export interface AuthStore{
    user: User|null;
    onLogin: (user: User)=>void;
    onLogout: ()=>void;
}