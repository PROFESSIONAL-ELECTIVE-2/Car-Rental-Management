import "./Card.css";

function Card({ title, description, image }) {
    return (
        <div className="card">
            <img src={image} alt={title} style={{ height: '200px', objectFit: 'cover' }} />
            <h2 className="card-title">{title}</h2>
            <p className="card-description">{description}</p>
        </div>
    );
}

export default Card;