const iconColors = ['green', 'purple', 'red', 'blue', 'orange'];

export default function RecentActivities({ activities = [] }) {
    return (
        <ul className="recent-activities">
            {activities.length ? activities.map((activity, index) => (
                <li key={activity.id || index}>
                    <span className={`activity-icon activity-icon-${iconColors[index % iconColors.length]}`}></span>
                    <div className="activity-content">
                        <strong>{activity.description}</strong>
                        <p>{activity.module || 'System update'}</p>
                    </div>
                    <time>{new Date(activity.created_at).toLocaleString()}</time>
                </li>
            )) : (
                <li className="empty-state">No recent activities</li>
            )}
        </ul>
    );
}
