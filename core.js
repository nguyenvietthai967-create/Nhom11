(function (root) {
    'use strict';

    const clone = (x) => JSON.parse(JSON.stringify(x));

    const uid = () => (
        globalThis.crypto?.randomUUID?.()
        || Date.now().toString(36) + Math.random().toString(36).slice(2)
    );

    function seed() {
        return {
            products: [
                {
                    id: 'SP01',
                    name: 'iPhone 15',
                    brand: 'Apple',
                    spec: '128GB · Đen',
                    price: 16990000,
                    stock: 12
                },
                {
                    id: 'SP02',
                    name: 'Galaxy S24',
                    brand: 'Samsung',
                    spec: '256GB · Tím',
                    price: 15990000,
                    stock: 8
                },
                {
                    id: 'SP03',
                    name: 'Xiaomi 14',
                    brand: 'Xiaomi',
                    spec: '256GB · Xanh',
                    price: 12990000,
                    stock: 3
                },
                {
                    id: 'SP04',
                    name: 'OPPO Reno11',
                    brand: 'OPPO',
                    spec: '256GB · Bạc',
                    price: 8990000,
                    stock: 6
                },
                {
                    id: 'SP05',
                    name: 'Galaxy A55',
                    brand: 'Samsung',
                    spec: '128GB · Xanh',
                    price: 7990000,
                    stock: 2
                },
                {
                    id: 'SP06',
                    name: 'iPhone 14',
                    brand: 'Apple',
                    spec: '128GB · Trắng',
                    price: 13990000,
                    stock: 0
                }
            ],

            customers: [
                {
                    id: 'KH01',
                    name: 'Khách mẫu 01',
                    phone: '0900000001'
                },
                {
                    id: 'KH02',
                    name: 'Khách mẫu 02',
                    phone: '0900000002'
                }
            ],

            orders: []
        };
    }

    function product(data, oldId, db) {
        const p = {
            id: oldId || data.id.trim().toUpperCase(),
            name: data.name.trim(),
            brand: data.brand.trim(),
            spec: data.spec.trim(),
            price: Number(data.price),
            stock: Number(data.stock)
        };

        if (
            !/^[A-Z0-9_-]{2,20}$/.test(p.id)
            || !p.name
            || !p.brand
            || !p.spec
        ) {
            throw Error(
                'Điền đủ thông tin; mã gồm 2–20 chữ, số, gạch dưới hoặc gạch ngang.'
            );
        }

        if (
            !Number.isSafeInteger(p.price)
            || p.price <= 0
            || p.price > 1000000000
            || !Number.isSafeInteger(p.stock)
            || p.stock < 0
            || p.stock > 100000
        ) {
            throw Error(
                'Giá phải là số nguyên từ 1 đến 1 tỷ; tồn kho từ 0 đến 100.000.'
            );
        }

        if (!oldId && db.products.some((x) => x.id === p.id)) {
            throw Error('Mã sản phẩm đã tồn tại.');
        }

        return p;
    }

    function customer(data, oldId, db) {
        const p = {
            id: oldId || 'KH-' + uid(),
            name: data.name.trim(),
            phone: data.phone.trim()
        };

        if (
            !p.name
            || p.name.length > 100
            || !/^0\d{9}$/.test(p.phone)
        ) {
            throw Error(
                'Tên tối đa 100 ký tự; điện thoại gồm 10 số, bắt đầu bằng 0.'
            );
        }

        const duplicated = db.customers.some(
            (x) => x.phone === p.phone && x.id !== oldId
        );

        if (duplicated) {
            throw Error('Số điện thoại đã tồn tại.');
        }

        return p;
    }

    function checkout(db, customerId, cart, discount, payment) {
        const d = clone(db);

        if (!d.customers.some((x) => x.id === customerId)) {
            throw Error('Vui lòng chọn khách hàng.');
        }

        if (!Array.isArray(cart) || !cart.length) {
            throw Error('Giỏ hàng đang trống.');
        }

        if (!['Tiền mặt', 'Chuyển khoản'].includes(payment)) {
            throw Error('Phương thức thanh toán không hợp lệ.');
        }

        const seen = new Set();
        let subtotal = 0;

        const items = cart.map((i) => {
            const p = d.products.find((p) => p.id === i.id);

            if (
                !p
                || seen.has(i.id)
                || !Number.isSafeInteger(i.qty)
                || i.qty <= 0
                || i.qty > p.stock
            ) {
                throw Error('Số lượng không hợp lệ hoặc vượt tồn kho.');
            }

            seen.add(i.id);

            p.stock -= i.qty;
            subtotal += p.price * i.qty;

            return {
                id: p.id,
                name: p.name,
                spec: p.spec,
                qty: i.qty,
                price: p.price
            };
        });

        discount = Number(discount);

        if (
            !Number.isSafeInteger(discount)
            || discount < 0
            || discount > subtotal
        ) {
            throw Error('Giảm giá phải từ 0 đến tạm tính.');
        }

        const c = d.customers.find((x) => x.id === customerId);

        d.orders.push({
            id: 'HD-' + uid(),
            date: new Date().toISOString(),
            customerId,
            customerName: c.name,
            customerPhone: c.phone,
            items,
            subtotal,
            discount,
            total: subtotal - discount,
            payment,
            status: 'paid'
        });

        return d;
    }

    function cancel(db, id) {
        const d = clone(db);
        const o = d.orders.find((x) => x.id === id);

        if (!o || o.status !== 'paid') {
            throw Error('Chỉ có thể hủy hóa đơn đang ghi nhận.');
        }

        o.items.forEach((i) => {
            const p = d.products.find((x) => x.id === i.id);

            if (!p) {
                throw Error('Không tìm thấy sản phẩm để hoàn kho.');
            }

            p.stock += i.qty;
        });

        o.status = 'cancelled';

        return d;
    }

    const api = {
        seed,
        product,
        customer,
        checkout,
        cancel
    };

    if (typeof module !== 'undefined') {
        module.exports = api;
    } else {
        root.PhoneCore = api;
    }
})(globalThis);