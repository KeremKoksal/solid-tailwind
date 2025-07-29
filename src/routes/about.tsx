import { A } from "@solidjs/router";
import Counter from "~/components/Counter";
import Tables from "~/components/Tables";
import { createResource } from "solid-js";

interface User {
    name: string;
    username: string;
    picture: string;
}

const fetchUsers = async (): Promise<User[]> => {
    try {
        const userRes = await fetch('https://randomuser.me/api/?results=5&inc=name,login,picture');
        if (!userRes.ok) {
            throw new Error(`HTTP error! status: ${userRes.status}`);
        }
        const userData = await userRes.json();
        return userData.results.map((user: any) => ({
            name: `${user.name.first} ${user.name.last}`,
            username: user.login.username,
            picture: user.picture.medium
        }));
    } catch (error) {
        console.error('Error fetching users:', error);
        return [];
    }
};

export default function About() {
    const [users] = createResource(fetchUsers);
    return (
        <main class="text-center mx-auto text-gray-700 p-4">
            <h1 class="max-6-xs text-6xl text-sky-700 font-thin uppercase my-16">About Page</h1>
            <Counter />
            <p class="mt-8">
                Visit{" "}
                <a href="https://solidjs.com" target="_blank" class="text-sky-600 hover:underline">
                    solidjs.com
                </a>{" "}
                to learn how to build Solid apps.
            </p>
            <p class="my-4">
                <A href="/" class="text-sky-600 hover:underline">
                    Home
                </A>{" "}
                - <span>About Page</span>
            </p>
            <div class="mt-8 mx-auto max-w-4xl">
                <Tables users={users() || []} />
            </div>
        </main>
    );
}