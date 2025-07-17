import { For } from "solid-js";
import studentAvatar from "../../public/avatar.png";
import defaultAvatar from "../../public/avatar1.png";

export default function Avatar(props: { isStudent: boolean[] }) {
    const avatarSizes = ["w-6", "w-8", "w-10", "w-12", "w-14", "w-16"];

    return (
        <div class="flex gap-2 justify-center items-center py-10">
            <For each={avatarSizes}>
                {(size, index) => {
                    const currentIsStudent = props.isStudent[index()];
                    const displayedAvatar = currentIsStudent ? studentAvatar : defaultAvatar;
                    return (
                        <img
                            src={displayedAvatar}
                            class={`rounded-full ${size} aspect-square`}
                            alt="avatar"
                        />
                    );
                }}
            </For>
        </div>
    );
}