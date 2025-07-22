import placeholderStudent from "../../public/avatar.png";
import defaultAvatar from "../../public/avatar1.png";

interface AvatarProps {
    isStudent: boolean;
    picture?: string | null;
}

export default function Avatar(props: AvatarProps) {
    const displayedAvatar = props.isStudent
        ? props.picture || placeholderStudent
        : defaultAvatar;

    return (
        <div class="fixed top-2 right-6 w-10 h-10 rounded-full overflow-hidden shadow-md">
            <img
                src={displayedAvatar}
                class="w-full h-full object-cover"
                alt="avatar"
            />
        </div>
    );
}
