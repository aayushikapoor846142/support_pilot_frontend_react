import { useState } from "react";
import { apiRequest } from "../services/apiService";

function AddProductForm({ product, onAddProduct, onClose }) {
    const isEditing = Boolean(product);
    const [name, setName] = useState(() => product?.name ?? "");
    const [price, setPrice] = useState(() => product?.price ?? "");
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(event) {
        event.preventDefault();

        if (!name.trim() || price === "" || !Number.isFinite(Number(price)) || Number(price) <= 0) {
            alert("Please enter a product name and a valid price.");
            return;
        }

        setIsSubmitting(true);

        try {
            const savedProduct = await apiRequest(
                `/products${isEditing ? `/${product._id ?? product.id}` : ""}`,
                {
                    method: isEditing ? "PUT" : "POST",
                    body: {
                    name: name.trim(),
                    price: Number(price),
                    },
                }
            );

            if (!savedProduct) {
                throw new Error("The product could not be saved.");
            }

            onAddProduct(savedProduct);
            setName("");
            setPrice("");
            onClose();
        } catch (error) {
            alert(error.message || "Unable to connect to the backend.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="product-form-modal" onClick={(event) => event.stopPropagation()}>
                <div className="modal-header">
                    <div>
                        <p className="eyebrow">CATALOG MANAGEMENT</p>
                        <h2>{isEditing ? "Edit product" : "Add product"}</h2>
                    </div>
                    <button type="button" className="close-button" onClick={onClose} aria-label="Close form">
                        ×
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="product-form">
                    <label>
                        <span>Product name</span>
                        <input
                            type="text"
                            placeholder="Enter product name"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            autoFocus
                        />
                    </label>

                    <label>
                        <span>Price (₹)</span>
                        <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            placeholder="0.00"
                            value={price}
                            onChange={(event) => setPrice(event.target.value)}
                        />
                    </label>

                    <div className="form-actions">
                        <button type="button" className="secondary-button" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="primary-button" disabled={isSubmitting}>
                            {isSubmitting ? "Saving..." : isEditing ? "Update product" : "Save product"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AddProductForm;
