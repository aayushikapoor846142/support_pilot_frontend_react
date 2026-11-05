
function ProductCard({ product, onOpenForm }) {
    return (
        <article className="product-card">
            <div className="product-visual">
                <span className="product-symbol">▦</span>
                <span className="active-badge">
                    <span></span> Available
                </span>
            </div>

            <div className="product-details">
                <p className="product-category">
                    PRODUCT #{product.id ?? product._id}
                </p>

                <h3>{product.name}</h3>

                <div className="product-footer">
                    <span className="price">
                        ₹{Number(product.price).toLocaleString("en-IN")}
                    </span>

                    <button
                        className="view-button"
                        onClick={() => onOpenForm(product)}
                    >
                        View details →
                    </button>
                </div>
            </div>
        </article>
    );
}

export default ProductCard;
