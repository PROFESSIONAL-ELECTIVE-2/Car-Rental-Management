import "./Card.css";

function Card(){
    return(
        <div className = "card">
            <img src = "https://www.caranddriver.com/features/g28985154/future-cars/" alt="car placeholder"></img>
            <h2 className = "card-title">Car</h2>
            <p className = "card-description">This is a description of the car.</p>
        </div>
    )

}

export default Card;