fetch('/admin/order-details', {
    method: 'GET',
    headers: {
        'Content-Type': 'application/json',
    },
})
    .then((response) => response.json())
    .then((response) => {
        console.log(response);
        const label = response.orders.map((item) => {
            return new Date(item.date).toLocaleDateString('en-GB');
        });
        const data = response.orders.map((item) => {
            return item.totalSpent;
        });

        new Chart(document.getElementById('saleschart'), {
            type: 'line',
            data: {
                labels: label,
                datasets: [
                    {
                        label: 'Sales Amount ',
                        data: data,
                        backgroundColor: 'black',
                        borderWidth: 3,
                        showLine: 2,
                        fill: false,
                        borderColor: 'rgb(75, 192, 192)',
                        tension: 0.1,
                    },
                ],
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                    },
                },
                legend: {
                    display: false,
                },
            },
        });
    });

//

fetch('/admin/order-details', {
    method: 'GET',
    headers: {
        'Content-Type': 'application/json',
    },
})
    .then((response) => response.json())
    .then((response) => {
        console.log(response + 'orders');
        const label = response.orders.map((item) => {
            return new Date(item.date).toLocaleDateString('en-GB');
        });
        const data = response.orders.map((item) => {
            return item.totalSpent;
        });

        new Chart(document.getElementById('productchart'), {
            type: 'bar',
            data: {
                labels: label,
                datasets: [
                    {
                        label: 'Quantity',
                        data: data,
                        borderWidth: 1,
                        // backgroundColor: ['#81F18D', '#FFFFFF'],
                        backgroundColor: ['rgba(255, 99, 132, 0.2)'],
                        borderColor: ['rgb(255, 99, 132)'],
                    },
                ],
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                    },
                },
                legend: {
                    display: false,
                },
            },
        });
    });

