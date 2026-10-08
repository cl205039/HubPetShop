<?php
require_once 'config.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$id = isset($_GET['id']) ? intval($_GET['id']) : null;

try {
    if ($method === 'GET') {
        if ($id) {
            $stmt = $pdo->prepare("SELECT * FROM petshops WHERE id = ?");
            $stmt->execute([$id]);
            $petshop = $stmt->fetch();

            if ($petshop) {
                echo json_encode(["status" => "success", "data" => $petshop]);
            } else {
                http_response_code(404);
                echo json_encode(["status" => "error", "message" => "Parceiro não encontrado"]);
            }
        } else {
            $stmt = $pdo->query("SELECT * FROM petshops");
            $petshops = $stmt->fetchAll();
            echo json_encode(["status" => "success", "data" => $petshops]);
        }
    } elseif ($method === 'PUT') {
        if (!$id) {
            http_response_code(400);
            throw new Exception("ID do parceiro é obrigatório para atualização.");
        }

        $input = json_decode(file_get_contents("php://input"), true);
        if (!$input) {
            http_response_code(400);
            throw new Exception("Dados de entrada inválidos.");
        }

        // Campos permitidos para atualização
        $allowedFields = ['nome', 'cnpj', 'email', 'telefone', 'endereco', 'aprovado'];
        $fields = [];
        $params = [];

        foreach ($allowedFields as $field) {
            if (isset($input[$field])) {
                $fields[] = "$field = ?";
                $params[] = $input[$field];
            }
        }

        if (empty($fields)) {
            http_response_code(400);
            throw new Exception("Nenhum campo válido para atualizar foi fornecido.");
        }

        $params[] = $id;
        $sql = "UPDATE petshops SET " . implode(', ', $fields) . " WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        if ($stmt->rowCount() > 0) {
            echo json_encode([
                "status" => "success",
                "message" => "Parceiro atualizado com sucesso"
            ]);
        } else {
            // Pode ser que o parceiro não exista ou os dados sejam os mesmos
            $stmtCheck = $pdo->prepare("SELECT id FROM petshops WHERE id = ?");
            $stmtCheck->execute([$id]);
            if ($stmtCheck->fetch()) {
                echo json_encode([
                    "status" => "success",
                    "message" => "Nenhuma alteração realizada (dados idênticos)"
                ]);
            } else {
                http_response_code(404);
                throw new Exception("Parceiro não encontrado.");
            }
        }
    } else {
        http_response_code(405);
        echo json_encode(["status" => "error", "message" => "Método $method não permitido"]);
    }
} catch (Exception $e) {
    if (http_response_code() == 200) {
        http_response_code(500);
    }
    echo json_encode([
        "status" => "error",
        "message" => $e->getMessage()
    ]);
}
