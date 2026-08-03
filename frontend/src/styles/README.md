# Organización de estilos

`index.css` es el único punto de entrada. La carpeta `legacy` contiene la base estructural y `theme` contiene los ajustes visuales del tema de Mercado Uno.

El orden de los `@import` es intencional: primero se carga toda la base y después todo el tema. Cambiar ese orden altera la cascada y puede modificar el diseño responsive.
