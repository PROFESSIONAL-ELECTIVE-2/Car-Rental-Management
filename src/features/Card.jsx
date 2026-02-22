import "./Card.css";

// We add { title, description, image } as props so we can reuse this component!
function Card({ title, description, image }) {
    return (
        <div className="card">
            {/* We use the props here instead of hardcoded text */}
            <img src={image} alt={title} style={{ height: '200px', objectFit: 'cover' }} />
            <h2 className="card-title">{title}</h2>
            <p className="card-description">{description}</p>
        </div>
    );
}

export default Card;