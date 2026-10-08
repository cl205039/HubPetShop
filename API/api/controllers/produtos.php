<?php

class Produtos
{
    public static function ofertasPorPetshop(int $petshopId): void
    {
        $sql = 'SELECT o.id AS oferta_id, p.id AS produto_id, p.nome, p.descricao, p.categoria, p.imagem, o.preco
                FROM ofertas o
                JOIN produtos p ON p.id = o.produto_id
                WHERE o.petshop_id = ?
                ORDER BY o.id';
        $stmt = Database::get()->prepare($sql);
        $stmt->execute([$petshopId]);

        $ofertas = array_map(function ($linha) {
            return [
                'ofertaId'  => (int)$linha['oferta_id'],
                'produtoId' => (int)$linha['produto_id'],
                'nome'      => $linha['nome'],
                'descricao' => $linha['descricao'],
                'categoria' => $linha['categoria'],
                'imagem'    => $linha['imagem'],
                'preco'     => (float)$linha['preco'],
            ];
        }, $stmt->fetchAll());

        Response::json($ofertas, 200);
    }

    public static function ofertas(?string $categoria): void
    {
        $sql = 'SELECT o.id AS oferta_id, p.id AS produto_id, p.nome, p.descricao, p.categoria, p.imagem, o.preco,
                       ps.id AS petshop_id, ps.nome AS petshop_nome, ps.nota AS petshop_nota, ps.distancia_km AS petshop_distancia_km
                FROM ofertas o
                JOIN produtos p ON p.id = o.produto_id
                JOIN petshops ps ON ps.id = o.petshop_id';
        $params = [];
        if (!empty($categoria)) {
            $sql .= ' WHERE p.categoria = ?';
            $params[] = $categoria;
        }
        $sql .= ' ORDER BY o.id';

        $stmt = Database::get()->prepare($sql);
        $stmt->execute($params);

        $ofertas = array_map(function ($linha) {
            return [
                'ofertaId'           => (int)$linha['oferta_id'],
                'produtoId'          => (int)$linha['produto_id'],
                'nome'               => $linha['nome'],
                'descricao'          => $linha['descricao'],
                'categoria'          => $linha['categoria'],
                'imagem'             => $linha['imagem'],
                'preco'              => (float)$linha['preco'],
                'petshopId'          => (int)$linha['petshop_id'],
                'petshopNome'        => $linha['petshop_nome'],
                'petshopNota'        => (float)$linha['petshop_nota'],
                'petshopDistanciaKm' => (float)$linha['petshop_distancia_km'],
            ];
        }, $stmt->fetchAll());

        Response::json($ofertas, 200);
    }
}
