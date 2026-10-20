const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../js/core.js');

test('Mã trùng bị từ chối', () => {
    const d = C.seed();

    assert.throws(() => {
        C.product(d.products[0], null, d);
    });
});

test('Giá âm và tồn thập phân bị từ chối', () => {
    const d = C.seed();

    assert.throws(() => {
        C.product(
            { ...d.products[0], price: -1 },
            'SP01',
            d
        );
    });

    assert.throws(() => {
        C.product(
            { ...d.products[0], stock: 1.5 },
            'SP01',
            d
        );
    });
});

test('Điện thoại sai và trùng bị từ chối', () => {
    const d = C.seed();

    assert.throws(() => {
        C.customer(
            { name: 'A', phone: '123' },
            null,
            d
        );
    });

    assert.throws(() => {
        C.customer(d.customers[0], null, d);
    });
});

test('Thanh toán trừ kho và tính tổng sau giảm giá', () => {
    const d = C.seed();

    const n = C.checkout(
        d,
        'KH01',
        [{ id: 'SP01', qty: 2 }],
        100000,
        'Tiền mặt'
    );

    assert.equal(n.products[0].stock, 10);
    assert.equal(d.products[0].stock, 12);
    assert.equal(n.orders[0].total, 33880000);
});

test('Vượt kho không làm thay đổi dữ liệu gốc', () => {
    const d = C.seed();
    const s = JSON.stringify(d);

    assert.throws(() => {
        C.checkout(
            d,
            'KH01',
            [{ id: 'SP01', qty: 99 }],
            0,
            'Tiền mặt'
        );
    });

    assert.equal(JSON.stringify(d), s);
});

test('Từ chối giỏ rỗng, khách sai, số lượng âm, giảm giá vượt tổng', () => {
    const d = C.seed();

    const cases = [
        ['KH01', [], 0],
        ['?', [{ id: 'SP01', qty: 1 }], 0],
        ['KH01', [{ id: 'SP01', qty: -1 }], 0],
        ['KH01', [{ id: 'SP01', qty: 1 }], 99999999]
    ];

    for (const [c, cart, discount] of cases) {
        assert.throws(() => {
            C.checkout(d, c, cart, discount, 'Tiền mặt');
        });
    }
});

test('Không cho phép lặp mã trong giỏ', () => {
    assert.throws(() => {
        C.checkout(
            C.seed(),
            'KH01',
            [
                { id: 'SP01', qty: 1 },
                { id: 'SP01', qty: 1 }
            ],
            0,
            'Tiền mặt'
        );
    });
});

test('Hủy hoàn kho một lần và loại khỏi doanh thu', () => {
    let d = C.checkout(
        C.seed(),
        'KH01',
        [{ id: 'SP02', qty: 3 }],
        0,
        'Chuyển khoản'
    );

    const id = d.orders[0].id;

    d = C.cancel(d, id);

    assert.equal(d.products[1].stock, 8);
    assert.equal(d.orders[0].status, 'cancelled');

    assert.throws(() => {
        C.cancel(d, id);
    });
});

test('Đơn lưu ảnh chụp giá và tên khách', () => {
    const d = C.checkout(
        C.seed(),
        'KH01',
        [{ id: 'SP01', qty: 1 }],
        0,
        'Tiền mặt'
    );

    d.products[0].price = 1;
    d.customers[0].name = 'Đã sửa';

    assert.equal(d.orders[0].items[0].price, 16990000);
    assert.equal(d.orders[0].customerName, 'Khách mẫu 01');
});