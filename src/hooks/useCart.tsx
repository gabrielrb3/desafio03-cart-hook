import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  
  
  const [cart, setCart] = useState<Product []>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');
    console.log(storagedCart);

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  console.log('-----Cart value------')
  console.log(cart)

  const addProduct = async (productId: number) => {
    try {
      
      const previousCart = [...cart]
      const currentProduct = previousCart.find(product => product.id === productId);
      
      const { amount: stockAmount }: Stock = await api.get(`/stock/${productId}`)
      .then(response => response.data)

      const productDetails = await api.get(`/products/${productId}`)
      .then(response => response.data)

      const previousAmount = currentProduct ? currentProduct.amount : 0
      const inCartAmount = previousAmount + 1

      if(inCartAmount > stockAmount) {
        toast.error('Quantidade solicitada fora de estoque');
        return
      }

      if(currentProduct) {
        currentProduct.amount = inCartAmount
      } else {  
        const newProduct = { 
          ...productDetails, 
          amount: inCartAmount,
        }
        previousCart.push(newProduct)
      }

      setCart(previousCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(previousCart))

    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const previousCart = [...cart]
      const productIndex = previousCart.findIndex(product => product.id === productId)

      if (productIndex >= 0) {
        previousCart.splice(productIndex, 1)
        setCart(previousCart)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(previousCart))
      } else {
        throw Error()
      }
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if(amount <= 0) {
        return
      }

      const previousCart = [...cart]
      const currentProduct = previousCart.find(product => product.id === productId);

      const { amount: stockAmount }: Stock = await api.get(`/stock/${productId}`)
      .then(response => response.data)

      if(amount > stockAmount) {
        toast.error('Quantidade solicitada fora de estoque');
        return
      }

      if(currentProduct) {
        currentProduct.amount = amount
        setCart(previousCart)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(previousCart))
      } else {
        throw Error()
      }
      
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
