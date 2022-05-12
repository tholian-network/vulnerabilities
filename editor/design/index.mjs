
document.addEventListener('DOMContentLoaded', () => {

	const filter = (query) => {

		let element = document.querySelector(query);
		if (element.childNodes.length > 0) {

			Array.from(element.childNodes).forEach((node) => {

				if (node.nodeName === '#text') {
					node.parentNode.removeChild(node);
				}

			});

		}

	};

	filter('body > header > fieldset');

}, true);

